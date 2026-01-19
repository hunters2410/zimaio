/*
  # Fix Payment Transactions and Instructions RLS Policies

  Updates RLS policies to work with the profiles table structure.

  ## Changes

  1. Drop existing policies on payment_transactions and payment_instructions
  2. Create new policies using profiles table
*/

-- Drop and recreate payment_transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin can update transactions" ON payment_transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Authenticated users can create their own transactions
CREATE POLICY "Users can create own transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can update all transactions
CREATE POLICY "Admin can update transactions"
  ON payment_transactions FOR UPDATE
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

-- Drop and recreate payment_instructions policies
DROP POLICY IF EXISTS "Public can view payment instructions" ON payment_instructions;
DROP POLICY IF EXISTS "Admin can manage payment instructions" ON payment_instructions;

-- Public can view instructions for active gateways
CREATE POLICY "Public can view payment instructions"
  ON payment_instructions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM payment_gateways
      WHERE payment_gateways.id = gateway_id
      AND payment_gateways.is_active = true
    )
  );

-- Admin can view all instructions
CREATE POLICY "Admin can view all instructions"
  ON payment_instructions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert instructions
CREATE POLICY "Admin can insert instructions"
  ON payment_instructions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update instructions
CREATE POLICY "Admin can update instructions"
  ON payment_instructions FOR UPDATE
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

-- Admin can delete instructions
CREATE POLICY "Admin can delete instructions"
  ON payment_instructions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );