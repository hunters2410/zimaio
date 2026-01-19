/*
  # Enhance Financial Management System

  ## Updates to Existing Tables
  
  ### 1. Enhance `wallets` table
  Add missing columns:
  - `pending_balance` (decimal)
  - `total_earned` (decimal)
  - `total_withdrawn` (decimal)
  - `updated_at` (timestamptz)

  ## New Tables
  
  ### 1. `payment_gateways`
  Payment gateway configurations
  
  ### 2. `vat_configurations`
  VAT/Tax management
  
  ### 3. `refunds`
  Refund management (enhanced version of order_refunds)
  
  ### 4. `financial_notifications`
  Track financial event notifications
  
  ### 5. `vendor_plans`
  Vendor subscription plans
  
  ### 6. `email_templates`
  Email template management
  
  ### 7. `vendor_performance_analytics`
  Track vendor performance metrics
  
  ## Security
  - Enable RLS on all tables
  - Add appropriate policies
*/

-- Add missing columns to wallets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'pending_balance'
  ) THEN
    ALTER TABLE wallets ADD COLUMN pending_balance decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_earned decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_withdrawn'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_withdrawn decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wallets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Payment Gateways Table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL,
  gateway_type text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  supported_currencies text[] DEFAULT ARRAY['USD']::text[],
  transaction_fee_percentage decimal(5,2) DEFAULT 0.00,
  transaction_fee_fixed decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment gateways"
  ON payment_gateways FOR ALL
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

-- VAT Configurations Table
CREATE TABLE IF NOT EXISTS vat_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  vat_rate decimal(5,2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 100),
  vat_name text DEFAULT 'VAT',
  is_active boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vat_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view VAT configurations"
  ON vat_configurations FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage VAT configurations"
  ON vat_configurations FOR ALL
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

-- Refunds Table (Enhanced)
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid,
  requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  refund_amount decimal(15,2) NOT NULL,
  refund_reason text NOT NULL,
  refund_status text DEFAULT 'pending' CHECK (refund_status IN ('pending', 'approved', 'rejected', 'processed')),
  refund_method text CHECK (refund_method IN ('original_payment', 'wallet', 'bank_transfer')),
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Admins can view all refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can request refunds"
  ON refunds FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can manage refunds"
  ON refunds FOR UPDATE
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

-- Financial Notifications Table
CREATE TABLE IF NOT EXISTS financial_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('payout', 'refund', 'settlement', 'payment_received', 'withdrawal_completed')),
  amount decimal(15,2) NOT NULL,
  currency_code text DEFAULT 'USD',
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial notifications"
  ON financial_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own financial notifications"
  ON financial_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert financial notifications"
  ON financial_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Vendor Plans Table
CREATE TABLE IF NOT EXISTS vendor_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  plan_description text,
  price decimal(10,2) NOT NULL,
  currency_code text DEFAULT 'USD',
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annually')),
  features jsonb DEFAULT '[]'::jsonb,
  product_limit integer,
  commission_rate decimal(5,2),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active plans"
  ON vendor_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage vendor plans"
  ON vendor_plans FOR ALL
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

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  template_subject text NOT NULL,
  template_body text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('order_confirmation', 'shipping_notification', 'refund_processed', 'welcome', 'password_reset', 'vendor_approval', 'custom')),
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
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

-- Vendor Performance Analytics Table
CREATE TABLE IF NOT EXISTS vendor_performance_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue decimal(15,2) DEFAULT 0.00,
  total_products integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  order_fulfillment_rate decimal(5,2) DEFAULT 0.00,
  average_delivery_time_days decimal(5,2) DEFAULT 0.00,
  return_rate decimal(5,2) DEFAULT 0.00,
  customer_satisfaction_score decimal(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, period_start, period_end)
);

ALTER TABLE vendor_performance_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own analytics"
  ON vendor_performance_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE vendor_profiles.id = vendor_performance_analytics.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON vendor_performance_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert analytics"
  ON vendor_performance_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_vat_country_code ON vat_configurations(country_code);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_user_id ON financial_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_unread ON financial_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor_id ON vendor_performance_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_period ON vendor_performance_analytics(period_start, period_end);