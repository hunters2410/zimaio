-- Drop existing restrictive policies if they exist (to be safe and ensure clean slate)
DROP POLICY IF EXISTS "Admins can view all vendor profiles" ON vendor_profiles;
DROP POLICY IF EXISTS "Admins can update all vendor profiles" ON vendor_profiles;
DROP POLICY IF EXISTS "Admins can delete vendor profiles" ON vendor_profiles;
DROP POLICY IF EXISTS "Admins can view all logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can update all logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can delete logistics profiles" ON logistics_profiles;

-- FORCE RLS to be simplified for Admins on Vendor Profiles
CREATE POLICY "Admins have full access to vendor_profiles"
  ON vendor_profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- FORCE RLS to be simplified for Admins on Logistics Profiles
CREATE POLICY "Admins have full access to logistics_profiles"
  ON logistics_profiles
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Ensure profiles table has admin update policy too, as we saw that before
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins have full access to profiles"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (
         auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    )
    WITH CHECK (
         auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
    );
