/*
  # Enhanced Multi-Currency Wallet System

  1. Changes to Existing Tables
    - Add currency-specific balance columns to wallets table
    - Add commission_rate field to products table
    
  2. New Tables
    - `withdrawal_requests`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references profiles)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (enum: pending, approved, rejected, completed)
      - `withdrawal_charges` (numeric)
      - `net_amount` (numeric, amount after charges)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `processed_by` (uuid, references profiles)
      - `rejection_reason` (text)
      - `payment_method` (text)
      - `account_details` (jsonb)
    
    - `wallet_transactions_detailed`
      - `id` (uuid, primary key)
      - `wallet_id` (uuid, references wallets)
      - `transaction_type` (enum: deposit, withdrawal, commission, charge, refund)
      - `amount` (numeric)
      - `currency` (text)
      - `balance_before` (numeric)
      - `balance_after` (numeric)
      - `reference_id` (uuid, for linking to orders/withdrawals)
      - `reference_type` (text, order/withdrawal/manual)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `metadata` (jsonb)

  3. Security
    - Enable RLS on all tables
    - Admins can manage all records
    - Vendors can view their own records and create withdrawal requests
    - Proper policies for each transaction type
*/

-- Add currency-specific balance columns to wallets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance_usd'
  ) THEN
    ALTER TABLE wallets ADD COLUMN balance_usd numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance_zig'
  ) THEN
    ALTER TABLE wallets ADD COLUMN balance_zig numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_commission_earned'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_commission_earned numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_withdrawn'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_withdrawn numeric(15,2) DEFAULT 0;
  END IF;
END $$;

-- Add commission rate to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE products ADD COLUMN commission_rate numeric(5,2) DEFAULT 10.00;
  END IF;
END $$;

-- Create withdrawal status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
  END IF;
END $$;

-- Create transaction type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'commission', 'charge', 'refund', 'payment');
  END IF;
END $$;

-- Create withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status withdrawal_status DEFAULT 'pending',
  withdrawal_charges numeric(15,2) DEFAULT 0,
  net_amount numeric(15,2) NOT NULL,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id),
  rejection_reason text,
  payment_method text,
  account_details jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create detailed wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions_detailed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  balance_before numeric(15,2) DEFAULT 0,
  balance_after numeric(15,2) DEFAULT 0,
  reference_id uuid,
  reference_type text,
  description text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_vendor ON withdrawal_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_currency ON withdrawal_requests(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_wallet ON wallet_transactions_detailed(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_type ON wallet_transactions_detailed(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_currency ON wallet_transactions_detailed(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_reference ON wallet_transactions_detailed(reference_id);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions_detailed ENABLE ROW LEVEL SECURITY;

-- Withdrawal requests policies
CREATE POLICY "Vendors can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
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

-- Wallet transactions detailed policies
CREATE POLICY "Users can view their own wallet transactions"
  ON wallet_transactions_detailed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = wallet_transactions_detailed.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallet transactions"
  ON wallet_transactions_detailed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create wallet transactions"
  ON wallet_transactions_detailed FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update withdrawal request updated_at
CREATE OR REPLACE FUNCTION update_withdrawal_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal requests
DROP TRIGGER IF EXISTS withdrawal_request_updated_at ON withdrawal_requests;
CREATE TRIGGER withdrawal_request_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_request_updated_at();

-- Function to calculate withdrawal charges (2% of amount)
CREATE OR REPLACE FUNCTION calculate_withdrawal_charges(amount numeric)
RETURNS numeric AS $$
BEGIN
  RETURN ROUND(amount * 0.02, 2);
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and important columns
COMMENT ON TABLE withdrawal_requests IS 'Tracks vendor withdrawal requests with admin approval workflow';
COMMENT ON TABLE wallet_transactions_detailed IS 'Detailed transaction log for all wallet activities';
COMMENT ON COLUMN wallets.balance_usd IS 'Balance in USD currency';
COMMENT ON COLUMN wallets.balance_zig IS 'Balance in ZIG currency';
COMMENT ON COLUMN products.commission_rate IS 'Commission rate percentage for admin (e.g., 10.00 for 10%)';
COMMENT ON COLUMN withdrawal_requests.withdrawal_charges IS 'Charges applied to withdrawal (typically 2%)';
COMMENT ON COLUMN withdrawal_requests.net_amount IS 'Amount vendor receives after charges';
