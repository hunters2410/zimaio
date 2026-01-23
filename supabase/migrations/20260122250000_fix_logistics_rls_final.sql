-- Final RLS fix for logistics_profiles to allow users to initialize their own profiles
-- This ensures that any authenticated user can create their own logistics profile if they don't have one

-- 1. Re-enable RLS 
ALTER TABLE logistics_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Logistics providers can manage own profile" ON logistics_profiles;
DROP POLICY IF EXISTS "Anyone can view active logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Public can view active logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can manage all logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can view all logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can update all logistics profiles" ON logistics_profiles;
DROP POLICY IF EXISTS "Admins can delete logistics profiles" ON logistics_profiles;

-- 3. Create comprehensive policies

-- Allow users to view their own profile, and admins to view all
CREATE POLICY "Users can view own logistics profile"
  ON logistics_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow public to see active profiles
CREATE POLICY "Public can view active carriers"
  ON logistics_profiles FOR SELECT
  TO public
  USING (is_active = true);

-- Allow ANY authenticated user to INSERT their own profile
-- This is critical for the "Initialize Profile" button to work
CREATE POLICY "Users can insert own logistics profile"
  ON logistics_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own profile, and admins to update all
CREATE POLICY "Users and admins can update logistics profiles"
  ON logistics_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow users to delete their own profile, and admins to delete all
CREATE POLICY "Users and admins can delete logistics profiles"
  ON logistics_profiles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Ensure the logistics role exists and is correctly named throughout the system
-- We standardized on 'logistic' in the frontend, let's make sure both work if checked in migrations
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'logistics';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'logistic';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
