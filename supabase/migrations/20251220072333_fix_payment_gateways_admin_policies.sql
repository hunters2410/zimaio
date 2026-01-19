/*
  # Fix Payment Gateways Admin RLS Policies
  
  Updates RLS policies to work with the new role system (user_roles and user_role_assignments tables)
  instead of the old profiles.role field.
  
  1. Policy Updates
    - Drop old admin policies that check profiles.role
    - Create new admin policies that check user_role_assignments and user_roles
  
  2. Security
    - Admin users can view ALL payment gateways (active and inactive)
    - Admin users can update, insert, and delete payment gateways
    - Regular users can only view active gateways
  
  3. Important Notes
    - This enables admins to see and configure all payment gateways
    - Non-admin users only see active gateways for checkout
*/

-- Drop old admin policies
DROP POLICY IF EXISTS "Admin can view all gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can update gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can insert gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can delete gateways" ON payment_gateways;

-- Create new admin policies using user_roles system
CREATE POLICY "Admin can view all gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can update gateways"
  ON payment_gateways FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can insert gateways"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can delete gateways"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );
