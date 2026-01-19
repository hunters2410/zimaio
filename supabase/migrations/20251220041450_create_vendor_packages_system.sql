/*
  # Vendor Packages and Subscription System

  ## Overview
  This migration creates a comprehensive vendor package and subscription system that allows:
  - Multiple subscription tiers with customizable features
  - Payment tracking and history
  - Feature-based access control for vendors
  - Support for multiple payment gateways (Stripe, PayPal, PayNow)

  ## New Tables
  
  ### `vendor_packages`
  Defines the subscription packages available to vendors
  - `id` (uuid, primary key)
  - `name` (text) - Package name (e.g., "Free", "Basic", "Pro", "Enterprise")
  - `description` (text) - Package description
  - `price_monthly` (decimal) - Monthly price in USD
  - `price_yearly` (decimal) - Yearly price in USD (optional)
  - `product_limit` (integer) - Maximum products vendor can upload
  - `has_ads_access` (boolean) - Can access advertising features
  - `has_promotion_access` (boolean) - Can promote/boost products
  - `has_analytics_access` (boolean) - Can access advanced analytics
  - `has_priority_support` (boolean) - Has priority customer support
  - `is_active` (boolean) - Is package currently available
  - `is_default` (boolean) - Is this the default package for new vendors
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `vendor_subscriptions`
  Tracks vendor's current subscription and status
  - `id` (uuid, primary key)
  - `vendor_id` (uuid) - Foreign key to auth.users
  - `package_id` (uuid) - Foreign key to vendor_packages
  - `status` (text) - active, cancelled, expired, pending
  - `billing_cycle` (text) - monthly, yearly
  - `current_period_start` (timestamptz)
  - `current_period_end` (timestamptz)
  - `cancel_at_period_end` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `vendor_transactions`
  Records all payment transactions
  - `id` (uuid, primary key)
  - `vendor_id` (uuid) - Foreign key to auth.users
  - `subscription_id` (uuid) - Foreign key to vendor_subscriptions
  - `package_id` (uuid) - Foreign key to vendor_packages
  - `amount` (decimal) - Transaction amount
  - `currency` (text) - Currency code (USD, SGD, etc.)
  - `payment_gateway` (text) - stripe, paypal, paynow
  - `payment_gateway_transaction_id` (text) - External transaction ID
  - `status` (text) - pending, completed, failed, refunded
  - `transaction_type` (text) - subscription, upgrade, renewal
  - `metadata` (jsonb) - Additional payment data
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admins can manage all package data
  - Vendors can only view their own subscription and transaction data
  - Public users can view active packages
*/

-- Create vendor_packages table
CREATE TABLE IF NOT EXISTS vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly decimal(10, 2) NOT NULL DEFAULT 0,
  price_yearly decimal(10, 2) DEFAULT 0,
  product_limit integer NOT NULL DEFAULT 10,
  has_ads_access boolean DEFAULT false,
  has_promotion_access boolean DEFAULT false,
  has_analytics_access boolean DEFAULT false,
  has_priority_support boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_subscriptions table
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES vendor_packages(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id)
);

-- Create vendor_transactions table
CREATE TABLE IF NOT EXISTS vendor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES vendor_subscriptions(id) ON DELETE SET NULL,
  package_id uuid NOT NULL REFERENCES vendor_packages(id) ON DELETE RESTRICT,
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_gateway text NOT NULL CHECK (payment_gateway IN ('stripe', 'paypal', 'paynow')),
  payment_gateway_transaction_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription', 'upgrade', 'renewal')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_package_id ON vendor_subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_status ON vendor_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_vendor_id ON vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_subscription_id ON vendor_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_status ON vendor_transactions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_packages_is_active ON vendor_packages(is_active);

-- Enable RLS
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_packages
CREATE POLICY "Anyone can view active packages"
  ON vendor_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert packages"
  ON vendor_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update packages"
  ON vendor_packages FOR UPDATE
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

CREATE POLICY "Admins can delete packages"
  ON vendor_packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for vendor_subscriptions
CREATE POLICY "Vendors can view own subscription"
  ON vendor_subscriptions FOR SELECT
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert subscriptions"
  ON vendor_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can update own subscription"
  ON vendor_subscriptions FOR UPDATE
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for vendor_transactions
CREATE POLICY "Vendors can view own transactions"
  ON vendor_transactions FOR SELECT
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert transactions"
  ON vendor_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default packages
INSERT INTO vendor_packages (name, description, price_monthly, price_yearly, product_limit, has_ads_access, has_promotion_access, has_analytics_access, has_priority_support, is_default, sort_order)
VALUES 
  ('Free', 'Perfect for getting started', 0, 0, 10, false, false, false, false, true, 1),
  ('Basic', 'For growing businesses', 29.99, 299.99, 50, true, false, true, false, false, 2),
  ('Pro', 'For established vendors', 79.99, 799.99, 200, true, true, true, false, false, 3),
  ('Enterprise', 'Unlimited everything', 199.99, 1999.99, 999999, true, true, true, true, false, 4)
ON CONFLICT DO NOTHING;

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_vendor_packages_updated_at ON vendor_packages;
CREATE TRIGGER update_vendor_packages_updated_at
  BEFORE UPDATE ON vendor_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_subscriptions_updated_at ON vendor_subscriptions;
CREATE TRIGGER update_vendor_subscriptions_updated_at
  BEFORE UPDATE ON vendor_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default package
CREATE OR REPLACE FUNCTION ensure_single_default_package()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE vendor_packages SET is_default = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_package_trigger ON vendor_packages;
CREATE TRIGGER ensure_single_default_package_trigger
  AFTER INSERT OR UPDATE ON vendor_packages
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_package();
