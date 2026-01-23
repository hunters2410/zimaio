-- Allow admins to view all logistics profiles
CREATE POLICY "Admins can view all logistics profiles"
  ON logistics_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to update all logistics profiles (for verification/activation)
CREATE POLICY "Admins can update all logistics profiles"
  ON logistics_profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow admins to delete logistics profiles
CREATE POLICY "Admins can delete logistics profiles"
  ON logistics_profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
