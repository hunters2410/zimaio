-- Fix Trigger Security and RLS
-- Run this in the Supabase SQL Editor

-- 1. Fix handle_order_settlement to be SECURITY DEFINER
-- This allows the trigger to update wallets/commissions even if the user (customer) doesn't have direct access.
CREATE OR REPLACE FUNCTION handle_order_settlement()
RETURNS TRIGGER 
SECURITY DEFINER -- CRITICAL CHANGE
SET search_path = public -- Best practice
AS $$
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
  -- Determine if we should process this event
  IF TG_OP = 'INSERT' THEN
    v_should_process := (NEW.payment_status = 'paid' OR NEW.status = 'delivered');
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_process := (NEW.payment_status = 'paid' OR NEW.status = 'delivered') 
                        AND (OLD.payment_status != 'paid' OR OLD.status != 'delivered');
  END IF;

  IF v_should_process THEN
    
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

    -- Calculate totals from order record
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

-- 2. Ensure Vendor Profiles are viewable (Critical for FK checks)
-- Note: Policy might already exist, so we skip if it does
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vendor_profiles' 
        AND policyname = 'Vendor profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Vendor profiles are viewable by everyone" 
        ON public.vendor_profiles FOR SELECT USING (true);
    END IF;
END $$;

-- 3. Ensure Shipping Methods are viewable
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'shipping_methods' 
        AND policyname = 'Shipping methods are viewable by everyone'
    ) THEN
        CREATE POLICY "Shipping methods are viewable by everyone" 
        ON public.shipping_methods FOR SELECT USING (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
