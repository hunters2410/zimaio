/*
  # Commission and VAT Logic Enhancements

  1. New Fields
    - Add commission settings to `vat_settings`
    - Add commission tracking to `orders`
  
  2. Logic
    - Create a view for calculating selling prices
    - Update order calculation logic
*/

-- Step 1: Add commission fields to vat_settings
ALTER TABLE vat_settings 
ADD COLUMN IF NOT EXISTS commission_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS commission_rate decimal(5,2) DEFAULT 10.00;

-- Step 2: Add commission tracking to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount numeric DEFAULT 0;

-- Step 3: Create a helper function to calculate product selling price
CREATE OR REPLACE FUNCTION calculate_selling_price(
  p_base_price numeric,
  p_vendor_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_comm_enabled boolean;
  v_comm_rate decimal;
  v_vat_enabled boolean;
  v_vat_rate decimal;
  v_comm_amount numeric;
  v_price_with_comm numeric;
  v_vat_amount numeric;
  v_final_price numeric;
BEGIN
  -- Get VAT settings
  SELECT is_enabled, default_rate, commission_enabled, commission_rate 
  INTO v_vat_enabled, v_vat_rate, v_comm_enabled, v_comm_rate
  FROM vat_settings 
  LIMIT 1;

  -- Commission calculation
  IF v_comm_enabled THEN
    -- Try to get vendor-specific rate first, then global
    SELECT COALESCE(commission_rate, v_comm_rate) INTO v_comm_rate
    FROM vendor_profiles
    WHERE id = p_vendor_id;
    
    v_comm_amount := p_base_price * (v_comm_rate / 100.0);
  ELSE
    v_comm_amount := 0;
  END IF;

  v_price_with_comm := p_base_price + v_comm_amount;

  -- VAT calculation
  IF v_vat_enabled THEN
    v_vat_amount := v_price_with_comm * (v_vat_rate / 100.0);
  ELSE
    v_vat_amount := 0;
  END IF;

  v_final_price := v_price_with_comm + v_vat_amount;

  RETURN jsonb_build_object(
    'base_price', p_base_price,
    'commission_amount', v_comm_amount,
    'vat_amount', v_vat_amount,
    'selling_price', v_final_price,
    'comm_rate', v_comm_rate,
    'vat_rate', v_vat_rate
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Create a view for products with calculated prices
CREATE OR REPLACE VIEW products_with_selling_prices AS
SELECT 
  p.*,
  (calculate_selling_price(p.base_price, p.vendor_id)->>'selling_price')::numeric as selling_price,
  (calculate_selling_price(p.base_price, p.vendor_id)->>'commission_amount')::numeric as commission_amount,
  (calculate_selling_price(p.base_price, p.vendor_id)->>'vat_amount')::numeric as vat_amount
FROM products p;

-- Step 5: Update the order creation trigger or logic to handle wallet transfers
-- We will handle this in the application logic for now, or create a function.
