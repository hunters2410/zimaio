
-- 1. Create Immutable Ledger Table
-- This table is designed to be an append-only log of all money movement
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid REFERENCES wallets(id), -- Optional: if tied to a specific wallet
  user_id uuid REFERENCES profiles(id), -- Optional: who owns the transaction
  transaction_type text NOT NULL, -- deposit, withdrawal, payment, refund, commission, adjustment
  amount numeric NOT NULL,
  currency_code text DEFAULT 'USD',
  status text DEFAULT 'completed', -- completed, pending, failed, cancelled
  reference_id text, -- external reference (e.g. payment gateway ID, order ID)
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Admins can view everything
CREATE POLICY "Admins view all ledger" ON transaction_ledger
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can view their own transactions
CREATE POLICY "Users view own ledger" ON transaction_ledger
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Create Trigger to Auto-Log Wallet Changes (Optional but recommended)
-- This ensures that every change to `wallets` is mirrored here if we wanted strict auditing.
-- However, for now, we will rely on the application inserting into this table or `wallet_transactions` mirroring.
-- Note: You already have `wallet_transactions` and `wallet_transactions_detailed`.
-- This `transaction_ledger` seems to be a requested 'Super View' or a consolidation.
-- IF `transaction_ledger` is meant to be the exact same as `wallet_transactions_detailed`, we should just use that.
-- But the Code is requesting `transaction_ledger`. So we create it.
