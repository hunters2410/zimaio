-- AGGRESSIVE RESET OF ADMIN PERMISSONS
-- This migration ensures that admins have absolute power over vendor, logistics, and user profiles.

-- 1. Helper Function (SECURITY DEFINER to bypass RLS during check)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- 3. ENSURE RLS IS ON
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_profiles ENABLE ROW LEVEL SECURITY;

-- 4. PROFILES POLICIES
CREATE POLICY "profiles_select_fixed" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_owner" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL TO authenticated USING (public.check_is_admin());

-- 5. VENDOR_PROFILES POLICIES
CREATE POLICY "vendor_profiles_select" ON vendor_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vendor_profiles_owner" ON vendor_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "vendor_profiles_admin" ON vendor_profiles FOR ALL TO authenticated USING (public.check_is_admin());

-- 6. LOGISTICS_PROFILES POLICIES
CREATE POLICY "logistics_profiles_select" ON logistics_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "logistics_profiles_owner" ON logistics_profiles FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "logistics_profiles_admin" ON logistics_profiles FOR ALL TO authenticated USING (public.check_is_admin());

-- 7. Specific Fix for Logistics Dependent Tables (shipping_methods, drivers)
-- Sometimes updates fail because of dependent RLS
CREATE POLICY "logistics_dependent_admin_methods" ON shipping_methods FOR ALL TO authenticated USING (public.check_is_admin());
CREATE POLICY "logistics_dependent_admin_drivers" ON delivery_drivers FOR ALL TO authenticated USING (public.check_is_admin());

-- 8. Final Check/Repair for Admin User
-- In case the admin profile is missing the 'admin' role in the DB
UPDATE profiles SET role = 'admin' WHERE email = 'admin@zimaio.com';
