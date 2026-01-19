/*
  # Complete Payment System Setup

  Sets up comprehensive payment gateway system with:
  - Enhanced payment_gateways table
  - Payment transactions tracking
  - Payment instructions for manual gateways
  - RLS policies for security
  - Default gateway configurations

  ## New Tables

  1. `payment_transactions` - Tracks all payment transactions
  2. `payment_instructions` - Step-by-step instructions for manual gateways

  ## Enhanced Tables

  1. `payment_gateways` - Added display_name, description, instructions, logo_url, sort_order

  ## Security

  - RLS enabled on all tables
  - Admin-only write access to gateways
  - Users can view own transactions
  - Public read access to active gateways
*/

-- Add new columns to payment_gateways
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'display_name') THEN
    ALTER TABLE payment_gateways ADD COLUMN display_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'description') THEN
    ALTER TABLE payment_gateways ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'instructions') THEN
    ALTER TABLE payment_gateways ADD COLUMN instructions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'logo_url') THEN
    ALTER TABLE payment_gateways ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'sort_order') THEN
    ALTER TABLE payment_gateways ADD COLUMN sort_order int DEFAULT 0;
  END IF;
END $$;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_id uuid REFERENCES payment_gateways(id) ON DELETE SET NULL,
  gateway_type text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  gateway_transaction_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'))
);

-- Create payment_instructions table
CREATE TABLE IF NOT EXISTS payment_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES payment_gateways(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(gateway_id, step_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_gateways_type ON payment_gateways(gateway_type);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_gateway ON payment_instructions(gateway_id);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_instructions ENABLE ROW LEVEL SECURITY;

-- Payment Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "System can create transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update transactions"
  ON payment_transactions FOR UPDATE
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

-- Payment Instructions Policies
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

CREATE POLICY "Admin can manage payment instructions"
  ON payment_instructions FOR ALL
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

-- Insert default payment gateways
INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, configuration, instructions, sort_order, supported_currencies)
VALUES
  (
    'paynow',
    'paynow',
    'PayNow Zimbabwe',
    'Fast and secure payments in Zimbabwe using mobile money (Ecocash, OneMoney) and bank cards',
    false,
    '{"integration_id": "", "integration_key": "", "return_url": "", "result_url": ""}'::jsonb,
    'To activate PayNow: 1. Sign up at https://www.paynow.co.zw 2. Get your Integration ID and Integration Key from your merchant dashboard 3. Enter these credentials in the configuration below 4. Configure your return_url and result_url for payment notifications 5. Test with a small transaction before going live',
    1,
    ARRAY['USD', 'ZWL']
  ),
  (
    'paypal',
    'paypal',
    'PayPal',
    'Accept payments worldwide with PayPal',
    false,
    '{"client_id": "", "client_secret": "", "mode": "sandbox"}'::jsonb,
    'To activate PayPal: 1. Create a PayPal Business account at https://www.paypal.com/business 2. Go to Developer Dashboard at https://developer.paypal.com 3. Create a REST API app under "My Apps & Credentials" 4. Copy the Client ID and Secret 5. Test in sandbox mode first, then switch to "live" for production',
    2,
    ARRAY['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
  ),
  (
    'stripe',
    'stripe',
    'Stripe',
    'Accept credit cards and digital wallets globally',
    false,
    '{"publishable_key": "", "secret_key": ""}'::jsonb,
    'To activate Stripe: 1. Sign up at https://stripe.com 2. Complete account verification 3. Go to Developers > API keys 4. Copy your Publishable key and Secret key 5. Use test keys for testing, then switch to live keys for production',
    3,
    ARRAY['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD']
  ),
  (
    'cash',
    'cash',
    'Cash on Delivery',
    'Pay with cash when your order is delivered',
    true,
    '{}'::jsonb,
    'Cash payment will be collected by the delivery person when your order arrives. Please have the exact amount ready as change may not always be available.',
    4,
    ARRAY['USD', 'ZWL']
  );

-- Create function to update payment transaction status
CREATE OR REPLACE FUNCTION update_payment_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- If payment is completed, update order payment status
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE orders
    SET payment_status = 'paid',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS trigger_update_payment_status ON payment_transactions;
CREATE TRIGGER trigger_update_payment_status
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transaction_status();