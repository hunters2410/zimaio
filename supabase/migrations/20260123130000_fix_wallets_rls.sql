/*
  # Fix RLS for Wallets to allow Admin Access
  
  1. Ensures strict RLS is enabled on wallets.
  2. Adds policy for users to see their own wallet.
  3. Adds policy for admins to see ALL wallets.
*/

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet"
ON wallets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Admins can view ALL wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets"
ON wallets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Admins can update ALL wallets (for manual adjustments)
DROP POLICY IF EXISTS "Admins can update all wallets" ON wallets;
CREATE POLICY "Admins can update all wallets"
ON wallets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Admins can insert wallets (if manual creation needed)
DROP POLICY IF EXISTS "Admins can insert wallets" ON wallets;
CREATE POLICY "Admins can insert wallets"
ON wallets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
