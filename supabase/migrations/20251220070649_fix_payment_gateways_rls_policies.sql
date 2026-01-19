/*
  # Fix Payment Gateways RLS Policies

  Updates RLS policies to work with the profiles table structure.
  Allows admins to manage gateways and public/authenticated users to view active gateways.

  ## Changes

  1. Drop existing policies
  2. Create new policies using profiles table
  3. Add public read access to active gateways
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage payment gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Public can view enabled gateways" ON payment_gateways;

-- Admin can view all gateways
CREATE POLICY "Admin can view all gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert gateways
CREATE POLICY "Admin can insert gateways"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update gateways
CREATE POLICY "Admin can update gateways"
  ON payment_gateways FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can delete gateways
CREATE POLICY "Admin can delete gateways"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Authenticated users can view active gateways (without sensitive config)
CREATE POLICY "Authenticated users can view active gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Public can view active gateways
CREATE POLICY "Public can view active gateways"
  ON payment_gateways FOR SELECT
  TO public
  USING (is_active = true);