/*
  # Product-Specific Commission and Admin Wallet Payouts

  1. Enhancements
    - Add `commission_rate` to `products` for per-product overrides.
    - Update `calculate_selling_price` to respect the hierarchy: Product > Vendor > Global.
    - Create a function to handle commission payouts to the admin wallet.
    - Add a trigger to automate these payouts on order completion.
*/

-- Step 1: Add commission_rate to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS commission_rate decimal(5,2);

-- Step 2: Update calculate_selling_price function
CREATE OR REPLACE FUNCTION calculate_selling_price(
  p_base_price numeric,
  p_vendor_id uuid,
  p_product_id uuid DEFAULT NULL
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
  -- Get Global Settings
  SELECT is_enabled, default_rate, commission_enabled, commission_rate 
  INTO v_vat_enabled, v_vat_rate, v_comm_enabled, v_comm_rate
  FROM vat_settings 
  LIMIT 1;

  -- Commission hierarchy lookup
  IF v_comm_enabled THEN
    -- 1. Check Product
    IF p_product_id IS NOT NULL THEN
      SELECT commission_rate INTO v_comm_rate
      FROM products
      WHERE id = p_product_id AND commission_rate IS NOT NULL;
    END IF;

    -- 2. If no product rate, check Vendor
    IF v_comm_rate IS NULL OR p_product_id IS NULL THEN
      SELECT commission_rate INTO v_comm_rate
      FROM vendor_profiles
      WHERE id = p_vendor_id AND commission_rate IS NOT NULL;
    END IF;

    -- 3. Global rate is already in v_comm_rate from vat_settings if others were null
    
    v_comm_amount := p_base_price * (COALESCE(v_comm_rate, 10.0) / 100.0);
  ELSE
    v_comm_amount := 0;
    v_comm_rate := 0;
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
    'comm_rate', COALESCE(v_comm_rate, 0),
    'vat_rate', v_vat_rate
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 3: Function to handle settlement after order is paid/completed
CREATE OR REPLACE FUNCTION handle_order_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_user_id uuid;
  v_admin_wallet_id uuid;
  v_vendor_user_id uuid;
  v_vendor_wallet_id uuid;
  v_comm_total numeric := 0;
  v_base_total numeric := 0;
  v_vat_total numeric := 0;
BEGIN
  -- Only trigger on 'paid' or 'delivered' status if not already processed
  IF (NEW.payment_status = 'paid' OR NEW.status = 'delivered') AND (OLD.payment_status != 'paid' OR OLD.status != 'delivered') THEN
    
    -- 1. Find the Admin
    SELECT id INTO v_admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    -- Get or create admin wallet
    INSERT INTO wallets (user_id) VALUES (v_admin_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_admin_wallet_id FROM wallets WHERE user_id = v_admin_user_id;

    -- 2. Find the Vendor User
    SELECT user_id INTO v_vendor_user_id FROM vendor_profiles WHERE id = NEW.vendor_id;
    -- Get or create vendor wallet
    INSERT INTO wallets (user_id) VALUES (v_vendor_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_vendor_wallet_id FROM wallets WHERE user_id = v_vendor_user_id;

    -- Calculate totals from order record (assuming we store them as per previous task)
    v_comm_total := COALESCE(NEW.commission_amount, 0);
    v_base_total := COALESCE(NEW.subtotal, 0);
    v_vat_total := COALESCE(NEW.vat_amount, 0);

    -- 3. Payout Vendor (Base Amount)
    IF v_base_total > 0 THEN
      UPDATE wallets SET balance = balance + v_base_total WHERE id = v_vendor_wallet_id;
      INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, status, reference_id, notes)
      VALUES (
        v_vendor_wallet_id, 
        'purchase', 
        v_base_total, 
        (SELECT balance - v_base_total FROM wallets WHERE id = v_vendor_wallet_id),
        (SELECT balance FROM wallets WHERE id = v_vendor_wallet_id),
        'completed',
        NEW.order_number,
        'Payment for order ' || NEW.order_number
      );
    END IF;

    -- 4. Payout Admin (Commission + VAT)
    IF (v_comm_total + v_vat_total) > 0 THEN
      UPDATE wallets SET balance = balance + (v_comm_total + v_vat_total) WHERE id = v_admin_wallet_id;
      INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, status, reference_id, notes)
      VALUES (
        v_admin_wallet_id, 
        'commission', 
        (v_comm_total + v_vat_total), 
        (SELECT balance - (v_comm_total + v_vat_total) FROM wallets WHERE id = v_admin_wallet_id),
        (SELECT balance FROM wallets WHERE id = v_admin_wallet_id),
        'completed',
        NEW.order_number,
        'Commission and VAT for order ' || NEW.order_number
      );
      
      -- Also log in commissions table
      INSERT INTO commissions (order_id, vendor_id, order_amount, commission_rate, commission_amount, status, paid_at)
      VALUES (NEW.id, NEW.vendor_id, NEW.total, 0, v_comm_total, 'paid', now());
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settlement
DROP TRIGGER IF EXISTS trg_order_settlement ON orders;
CREATE TRIGGER trg_order_settlement
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_settlement();
