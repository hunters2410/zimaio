-- Comprehensive RLS Policy Fixes for Admin Operations & Table Creation

-- 1. Ensure the is_admin function exists and is secure
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create missing logging tables if they don't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    role TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT, -- 'success', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can perform all actions" ON public.profiles;
CREATE POLICY "Admins can perform all actions" ON public.profiles
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Vendor Profiles Policies
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage vendor profiles" ON public.vendor_profiles;
CREATE POLICY "Admins can manage vendor profiles" ON public.vendor_profiles
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Vendor Subscriptions Policies
ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage vendor subscriptions" ON public.vendor_subscriptions;
CREATE POLICY "Admins can manage vendor subscriptions" ON public.vendor_subscriptions
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Products Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 7. Delivery Drivers Policies
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage drivers" ON public.delivery_drivers;
CREATE POLICY "Admins can manage drivers" ON public.delivery_drivers
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 8. Wallets Policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage wallets" ON public.wallets;
CREATE POLICY "Admins can manage wallets" ON public.wallets
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 9. Audit Logs Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
    FOR SELECT
    USING (public.is_admin());

-- 10. Login Logs Policies
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view login logs" ON public.login_logs;
CREATE POLICY "Admins can view login logs" ON public.login_logs
    FOR SELECT
    USING (public.is_admin());
-- Also allow insert for login logs (server-side usually, but if client does it via certain flows)
CREATE POLICY "System can insert login logs" ON public.login_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');


-- 11. Allow authenticated users to view profiles (needed for various lookups)
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profile info" ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');
