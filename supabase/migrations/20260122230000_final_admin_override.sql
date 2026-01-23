-- FINAL ADMIN OVERRIDE AND ROLE VERIFICATION
-- This migration ensures globalhunterstech@gmail.com is an admin and has full access.

-- 1. Ensure the user exists in profiles and has admin role
-- We use a subquery to find the ID from auth.users to be safe
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'globalhunterstech@gmail.com';
    
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, email, role, full_name, is_active)
        VALUES (target_user_id, 'globalhunterstech@gmail.com', 'admin', 'Global Hunters Tech', true)
        ON CONFLICT (id) DO UPDATE 
        SET role = 'admin', is_active = true;
    END IF;
    
    -- Also ensure the other admin email is fixed
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@zimaio.com';
    IF target_user_id IS NOT NULL THEN
        UPDATE public.profiles SET role = 'admin' WHERE id = target_user_id;
    END IF;
END $$;

-- 2. Robust Admin Check Function (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_admin_privileges()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Reset and Re-grant Policies
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'vendor_profiles', 'logistics_profiles', 'products', 'categories', 'brands', 'orders', 'order_items')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- UNIVERSAL ADMIN POLICY: Grant ALL to anyone who passes public.check_admin_privileges()
CREATE POLICY "admin_full_access_profiles" ON public.profiles FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_vendors" ON public.vendor_profiles FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_logistics" ON public.logistics_profiles FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_products" ON public.products FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_categories" ON public.categories FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_brands" ON public.brands FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_orders" ON public.orders FOR ALL TO authenticated USING (public.check_admin_privileges());
CREATE POLICY "admin_full_access_order_items" ON public.order_items FOR ALL TO authenticated USING (public.check_admin_privileges());

-- REGULAR USER POLICIES (to keep system functional for others)
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "vendor_select_public" ON public.vendor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendor_manage_self" ON public.vendor_profiles FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "products_select_public" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_manage_vendor" ON public.products FOR ALL TO authenticated USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
);
