-- Create RPC to handle POS orders securely without RLS friction
-- This function runs with SECURITY DEFINER privileges to bypass specific RLS restrictions on inserts
-- while still validating the user's permission to act as the vendor.

CREATE OR REPLACE FUNCTION create_pos_order(
  order_payload jsonb,
  items_payload jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id uuid;
  v_user_id uuid;
  v_order_id uuid;
  v_item jsonb;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  v_vendor_id := (order_payload->>'vendor_id')::uuid;
  
  -- 1. Authorization Check
  -- Allow if user is owner of the vendor profile OR is an admin
  IF NOT EXISTS (
    SELECT 1 FROM vendor_profiles 
    WHERE id = v_vendor_id AND user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not the owner of this vendor profile';
  END IF;

  -- 2. Insert Order
  INSERT INTO orders (
    order_number,
    vendor_id,
    customer_id,
    total,
    subtotal,
    commission_amount,
    vat_amount,
    status,
    payment_status,
    payment_method,
    shipping_address,
    items
  ) VALUES (
    order_payload->>'order_number',
    v_vendor_id,
    (order_payload->>'customer_id')::uuid,
    (order_payload->>'total')::numeric,
    (order_payload->>'subtotal')::numeric,
    (order_payload->>'commission_amount')::numeric,
    (order_payload->>'vat_amount')::numeric,
    (order_payload->>'status')::order_status,
    (order_payload->>'payment_status')::payment_status,
    order_payload->>'payment_method',
    (order_payload->>'shipping_address')::jsonb,
    (order_payload->>'items')::jsonb
  )
  RETURNING id INTO v_order_id;

  -- 3. Insert Items and Update Stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(items_payload)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      (v_item->>'id')::uuid,
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric,
      ((v_item->>'price')::numeric * (v_item->>'quantity')::integer)
    );

    -- Decrement stock directly
    UPDATE products 
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = (v_item->>'id')::uuid;
  END LOOP;

  -- 4. Return the new order
  SELECT to_jsonb(orders.*) INTO v_result FROM orders WHERE id = v_order_id;
  RETURN v_result;

END;
$$;
