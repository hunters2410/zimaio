-- MASTER FIX FOR POS SYSTEM
-- This script fixes the two remaining issues:
-- 1. VISIBILITY: Allows vendors to see orders in their list (even walk-in orders).
-- 2. FINANCE: Ensures commissions and wallet balances update immediately upon sale.

-- PART 1: FIX VISIBILITY ("No orders created" issue)
-- We add a specific permission so vendors can view all orders linked to their profile.
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Vendors can view own orders" ON orders;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Vendors can view own orders"
ON orders FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
  )
);

-- PART 2: FIX FINANCIAL RECORDING
-- We update the settlement trigger to process financial data on INSERT (Creation), not just UPDATE.
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
  v_should_process boolean := false;
BEGIN
  -- Check if we should process this order (Paid + Delivered)
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.payment_status = 'paid' OR NEW.status = 'delivered') THEN
      v_should_process := true;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (NEW.payment_status = 'paid' OR NEW.status = 'delivered') AND 
       ((OLD.payment_status IS DISTINCT FROM 'paid') AND (OLD.status IS DISTINCT FROM 'delivered')) THEN
      v_should_process := true;
    END IF;
  END IF;

  IF v_should_process THEN
    -- 1. Setup Admin Wallet
    SELECT id INTO v_admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    INSERT INTO wallets (user_id) VALUES (v_admin_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_admin_wallet_id FROM wallets WHERE user_id = v_admin_user_id;

    -- 2. Setup Vendor Wallet
    SELECT user_id INTO v_vendor_user_id FROM vendor_profiles WHERE id = NEW.vendor_id;
    INSERT INTO wallets (user_id) VALUES (v_vendor_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_vendor_wallet_id FROM wallets WHERE user_id = v_vendor_user_id;

    -- 3. Calculate Totals
    v_comm_total := COALESCE(NEW.commission_amount, 0);
    v_base_total := COALESCE(NEW.subtotal, 0);
    v_vat_total := COALESCE(NEW.vat_amount, 0);

    -- 4. Payout Vendor (Base Amount)
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

    -- 5. Payout Admin (Commission + VAT)
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
      
      -- Record Commission
      INSERT INTO commissions (order_id, vendor_id, order_amount, commission_rate, commission_amount, status, paid_at)
      VALUES (NEW.id, NEW.vendor_id, NEW.total, 0, v_comm_total, 'paid', now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach Trigger
DROP TRIGGER IF EXISTS trg_order_settlement ON orders;
CREATE TRIGGER trg_order_settlement
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION handle_order_settlement();
