-- Global Stock Management System
-- This ensures stock decreases automatically whenever an order item is created,
-- and handles POS/Website consistency.

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION handle_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement stock when a new item is ordered
    IF (TG_OP = 'INSERT') THEN
        UPDATE products
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Optional: Log if stock goes negative (overselling)
        -- In a real production system, you might want to prevent this 
        -- but for this MVP we allow it or handle it via frontend checks.
    
    -- Refund stock if an item is removed or order cancelled (if logic allows deleting items)
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE products
        SET stock_quantity = stock_quantity + OLD.quantity
        WHERE id = OLD.product_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the Trigger to order_items
DROP TRIGGER IF EXISTS trg_manage_stock ON order_items;
CREATE TRIGGER trg_manage_stock
AFTER INSERT OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION handle_stock_on_order_item();

-- 3. FIX POS DOUBLE-DECREMENT
-- We need to update the POS RPC to STOP manually decrementing stock, 
-- because the trigger above will now handle it automatically.
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
  
  -- Security Check
  IF NOT EXISTS (
    SELECT 1 FROM vendor_profiles 
    WHERE id = v_vendor_id AND user_id = v_user_id
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not the owner of this vendor profile';
  END IF;

  -- Insert Order
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

  -- Insert Items
  -- THE TRIGGER 'trg_manage_stock' WILL NOW HANDLE UPDATING PRODUCTS TABLE
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
  END LOOP;

  -- Return the new order
  SELECT to_jsonb(orders.*) INTO v_result FROM orders WHERE id = v_order_id;
  RETURN v_result;

END;
$$;
