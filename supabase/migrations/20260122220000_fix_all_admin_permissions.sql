-- FIX RECURSION AND ENSURE ADMIN POWER
-- This migration uses a more robust approach to avoid RLS recursion while granting admins full access.

-- 1. Create a function that check for admin role using a more direct query
-- We use SECURITY DEFINER and specifically set the search_path to public.
-- This allows the function to bypass RLS when querying the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. COMPLETELY DROP ALL POLICIES on target tables to start fresh
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE tablename IN ('profiles', 'vendor_profiles', 'logistics_profiles')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. PROFILES POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Basic profile policies
CREATE POLICY "allow_all_view_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_owner_update_profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 4. Admin profile policies - using the bypass function
CREATE POLICY "admin_manage_profiles" ON profiles FOR ALL TO authenticated 
USING (public.is_admin(auth.uid()));

-- 5. VENDOR_PROFILES POLICIES
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_view_vendors" ON vendor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_owner_manage_vendor" ON vendor_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_vendors" ON vendor_profiles FOR ALL TO authenticated 
USING (public.is_admin(auth.uid()));

-- 5.1 PRODUCTS POLICIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_products" ON products FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 5.2 CATEGORIES/BRANDS POLICIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_categories" ON categories FOR ALL TO authenticated USING (public.is_admin(auth.uid()));
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_brands" ON brands FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- 6. LOGISTICS_PROFILES POLICIES
ALTER TABLE logistics_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_view_logistics" ON logistics_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_owner_manage_logistics" ON logistics_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_manage_logistics" ON logistics_profiles FOR ALL TO authenticated 
USING (public.is_admin(auth.uid()));

-- 7. Ensure admin user exists and has the correct role
UPDATE profiles SET role = 'admin' WHERE email = 'globalhunterstech@gmail.com';
