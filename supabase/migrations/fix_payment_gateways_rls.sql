-- Clean up ALL possible existing policy names to avoid naming conflicts
DROP POLICY IF EXISTS "Admins view all gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admins update gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admins insert gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admins delete gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can view all gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can update gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can insert gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can delete gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admins full access gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Public view active gateways" ON payment_gateways;

-- 1. Public Select Policy (For Checkout)
CREATE POLICY "Public view active gateways" 
  ON payment_gateways FOR SELECT 
  USING (is_active = true);

-- 2. Comprehensive Admin Policies (For Admin Panel)
-- This checks both the new "user_roles" system AND the legacy "profiles.role" field.
CREATE POLICY "Admins view all gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  );

CREATE POLICY "Admins update gateways"
  ON payment_gateways FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  );

CREATE POLICY "Admins insert gateways"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  );

CREATE POLICY "Admins delete gateways"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  );

-- Also fix and verify payment_instructions access
ALTER TABLE payment_instructions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access instructions" ON payment_instructions;
CREATE POLICY "Admins full access instructions"
  ON payment_instructions FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    OR
    (EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    ))
  );
