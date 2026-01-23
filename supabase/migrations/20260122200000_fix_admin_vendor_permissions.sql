-- Allow admins to view all vendor profiles
CREATE POLICY "Admins can view all vendor profiles"
  ON vendor_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to update all vendor profiles (for approval, etc.)
CREATE POLICY "Admins can update all vendor profiles"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to delete vendor profiles
CREATE POLICY "Admins can delete vendor profiles"
  ON vendor_profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to update all user profiles (for activation/deactivation)
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
