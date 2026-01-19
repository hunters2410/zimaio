import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- Create transaction_ledger table
CREATE TABLE IF NOT EXISTS transaction_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'commission', 'payout', 'fee', 'adjustment')),
  amount decimal(15,2) NOT NULL CHECK (amount >= 0),
  currency_code text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
  reference_id text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE transaction_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all transactions" ON transaction_ledger;
DROP POLICY IF EXISTS "Vendors can view own transactions" ON transaction_ledger;
DROP POLICY IF EXISTS "Users can view own transactions" ON transaction_ledger;
DROP POLICY IF EXISTS "System can insert transactions" ON transaction_ledger;

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transaction_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Vendors can view their own transactions
CREATE POLICY "Vendors can view own transactions"
  ON transaction_ledger FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE vendor_profiles.id = transaction_ledger.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transaction_ledger FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow system to insert transactions
CREATE POLICY "System can insert transactions"
  ON transaction_ledger FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_type ON transaction_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_status ON transaction_ledger(status);
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_created_at ON transaction_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_reference_id ON transaction_ledger(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_user_id ON transaction_ledger(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_vendor_id ON transaction_ledger(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_currency ON transaction_ledger(currency_code);
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_user_created ON transaction_ledger(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transaction_ledger_vendor_created ON transaction_ledger(vendor_id, created_at DESC) WHERE vendor_id IS NOT NULL;
`;

async function runMigration() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✓ Transaction ledger table created successfully');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigration();
