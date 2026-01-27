-- FINAL COMPREHENSIVE FIX FOR CHECKOUT
-- Run this entire script in Supabase SQL Editor to fix all checkout issues

-- ==============================================
-- PART 1: Profile Schema Fix
-- ==============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS street_address text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);

-- ==============================================
-- PART 2: Orders RLS Policies
-- ==============================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
CREATE POLICY "Customers can insert own orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders" 
ON public.orders 
FOR UPDATE
TO authenticated 
USING (auth.uid() = customer_id);

-- ==============================================
-- PART 3: Order Items RLS Policies
-- ==============================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items" 
ON public.order_items 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.customer_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.customer_id = auth.uid() OR orders.vendor_id = auth.uid())
    )
);

-- ==============================================
-- PART 4: Profiles RLS Policies
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- ==============================================
-- PART 5: Payment Transactions RLS Policies
-- ==============================================
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.payment_transactions;
CREATE POLICY "Users can insert own transactions" 
ON public.payment_transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- ==============================================
-- PART 6: Payment Gateways Public Access
-- ==============================================
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'payment_gateways' 
        AND policyname = 'Anyone can view active gateways'
    ) THEN
        CREATE POLICY "Anyone can view active gateways" 
        ON public.payment_gateways 
        FOR SELECT 
        USING (is_active = true);
    END IF;
END $$;

-- ==============================================
-- PART 7: Vendor Profiles Public Access
-- ==============================================
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

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

-- ==============================================
-- PART 8: Shipping Methods Public Access
-- ==============================================
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

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

-- ==============================================
-- PART 9: Fix Commission Trigger (CRITICAL!)
-- ==============================================
CREATE OR REPLACE FUNCTION handle_order_settlement()
RETURNS TRIGGER 
SECURITY DEFINER  -- Allows trigger to bypass RLS
SET search_path = public
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
  IF TG_OP = 'INSERT' THEN
    v_should_process := (NEW.payment_status = 'paid' OR NEW.status = 'delivered');
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_process := (NEW.payment_status = 'paid' OR NEW.status = 'delivered') 
                        AND (OLD.payment_status != 'paid' OR OLD.status != 'delivered');
  END IF;

  IF v_should_process THEN
    SELECT id INTO v_admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;
    INSERT INTO wallets (user_id) VALUES (v_admin_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_admin_wallet_id FROM wallets WHERE user_id = v_admin_user_id;

    SELECT user_id INTO v_vendor_user_id FROM vendor_profiles WHERE id = NEW.vendor_id;
    INSERT INTO wallets (user_id) VALUES (v_vendor_user_id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_vendor_wallet_id FROM wallets WHERE user_id = v_vendor_user_id;

    v_comm_total := COALESCE(NEW.commission_amount, 0);
    v_base_total := COALESCE(NEW.subtotal, 0);
    v_vat_total := COALESCE(NEW.vat_amount, 0);

    IF v_base_total > 0 THEN
      UPDATE wallets SET balance = balance + v_base_total WHERE id = v_vendor_wallet_id;
      INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, status, reference_id, notes)
      VALUES (v_vendor_wallet_id, 'purchase', v_base_total, (SELECT balance - v_base_total FROM wallets WHERE id = v_vendor_wallet_id), (SELECT balance FROM wallets WHERE id = v_vendor_wallet_id), 'completed', NEW.order_number, 'Payment for order ' || NEW.order_number);
    END IF;

    IF (v_comm_total + v_vat_total) > 0 THEN
      UPDATE wallets SET balance = balance + (v_comm_total + v_vat_total) WHERE id = v_admin_wallet_id;
      INSERT INTO wallet_transactions (wallet_id, type, amount, balance_before, balance_after, status, reference_id, notes)
      VALUES (v_admin_wallet_id, 'commission', (v_comm_total + v_vat_total), (SELECT balance - (v_comm_total + v_vat_total) FROM wallets WHERE id = v_admin_wallet_id), (SELECT balance FROM wallets WHERE id = v_admin_wallet_id), 'completed', NEW.order_number, 'Commission and VAT for order ' || NEW.order_number);
      
      INSERT INTO commissions (order_id, vendor_id, order_amount, commission_rate, commission_amount, status, paid_at)
      VALUES (NEW.id, NEW.vendor_id, NEW.total, 0, v_comm_total, 'paid', now());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- PART 10: Verification Queries
-- ==============================================

-- Check active payment gateways
SELECT 
    gateway_name,
    gateway_type,
    display_name,
    is_active,
    CASE 
        WHEN configuration->>'application_id' = '' OR configuration->>'application_id' IS NULL THEN '❌ Not configured'
        ELSE '✅ Configured'
    END as credential_status
FROM payment_gateways
WHERE is_active = true
ORDER BY sort_order;

-- Refresh Schema
NOTIFY pgrst, 'reload schema';

-- Success Message
DO $$
BEGIN
    RAISE NOTICE '✅ All checkout fixes applied successfully!';
    RAISE NOTICE '🔧 Next steps:';
    RAISE NOTICE '   1. Verify iVeri credentials are configured (see output above)';
    RAISE NOTICE '   2. Test checkout on localhost:5173';
    RAISE NOTICE '   3. Check browser console for detailed logs';
END $$;
