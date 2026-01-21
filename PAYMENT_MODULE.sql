-- PAYMENT_MODULE.sql
-- Module for Payment Gateways and Transactions

-- 1. Payment Gateway Table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text UNIQUE NOT NULL,
  gateway_type text NOT NULL, -- 'paynow', 'paypal', 'stripe', 'cash', 'manual'
  display_name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  supported_currencies text[] DEFAULT '{USD, ZWL}'::text[],
  instructions text,
  logo_url text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
  gateway_id uuid REFERENCES payment_gateways(id) ON DELETE SET NULL,
  gateway_type text,
  transaction_reference text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Public view active gateways" ON payment_gateways;
CREATE POLICY "Public view active gateways" 
  ON payment_gateways FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Users view own transactions" ON payment_transactions;
CREATE POLICY "Users view own transactions" 
  ON payment_transactions FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own transactions" ON payment_transactions;
CREATE POLICY "Users insert own transactions" 
  ON payment_transactions FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins full access gateways" ON payment_gateways;
CREATE POLICY "Admins full access gateways" 
  ON payment_gateways FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins view all transactions" ON payment_transactions;
CREATE POLICY "Admins view all transactions" 
  ON payment_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Seed initial gateways if empty
INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, sort_order)
SELECT 'paynow', 'paynow', 'PayNow Zimbabwe', 'Pay via Ecocash, OneMoney or Telecash', 1
WHERE NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paynow');

INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, sort_order)
SELECT 'paypal', 'paypal', 'PayPal / Credit Card', 'Global secure payments', 2
WHERE NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paypal');
