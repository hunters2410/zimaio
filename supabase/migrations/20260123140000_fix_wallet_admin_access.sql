
-- 1. Create a secure function to force update/create wallet
-- This function runs as SECURITY DEFINER to bypass RLS for the Admin
CREATE OR REPLACE FUNCTION admin_update_wallet_balance(
  target_user_id uuid,
  new_balance_usd numeric,
  new_balance_zig numeric,
  description text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wallet_record wallets%ROWTYPE;
BEGIN
  -- Check if executor is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin only.';
  END IF;

  -- Upsert wallet
  INSERT INTO wallets (user_id, balance_usd, balance_zig)
  VALUES (target_user_id, new_balance_usd, new_balance_zig)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance_usd = EXCLUDED.balance_usd,
    balance_zig = EXCLUDED.balance_zig,
    updated_at = now()
  RETURNING * INTO wallet_record;

  -- Log transaction
  INSERT INTO wallet_transactions_detailed (
    wallet_id,
    transaction_type,
    amount,
    currency,
    balance_after,
    description,
    created_by,
    metadata
  )
  VALUES (
    wallet_record.id,
    'deposit', -- treating as manual adjustment/deposit
    0, -- we aren't tracking the delta here, just setting the state
    'USD',
    new_balance_usd,
    description,
    auth.uid(),
    '{"source": "admin_manual_rpc"}'::jsonb
  );

  RETURN row_to_json(wallet_record);
END;
$$;

-- 2. Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON wallets;
DROP POLICY IF EXISTS "Users can create own wallet" ON wallets;
-- Also alternate names
DROP POLICY IF EXISTS "Users view own" ON wallets;
DROP POLICY IF EXISTS "Admins view all" ON wallets;
DROP POLICY IF EXISTS "Admins update all" ON wallets;
DROP POLICY IF EXISTS "Admins insert all" ON wallets;

-- 3. Ensure RLS is enabled
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- 4. Re-create robust policies
-- Admins: FULL ACCESS
CREATE POLICY "Admins full access" ON wallets
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: View Only (Own)
CREATE POLICY "Users view own" ON wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
