/*
  # Add Multi-Currency Support

  1. Changes
    - Add currency_code column to products table with default 'USD'
    - Add currency_code column to orders table
    - Add exchange_rate column to orders table for historical tracking
    - Create exchange_rates table for managing currency conversions
    - Add currency preferences to profiles table (already exists)

  2. Supported Currencies
    - USD (United States Dollar)
    - ZWL (Zimbabwean Dollar)

  3. Notes
    - Products can be priced in any supported currency
    - Orders store the currency and exchange rate at time of purchase
    - User preferences allow selecting default currency
*/

-- Add currency_code to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE products ADD COLUMN currency_code text DEFAULT 'USD';
  END IF;
END $$;

-- Add currency fields to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency_code text DEFAULT 'USD';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE orders ADD COLUMN exchange_rate decimal(10,4) DEFAULT 1.0;
  END IF;
END $$;

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate decimal(10,4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Enable RLS on exchange_rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read exchange rates
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage exchange rates
CREATE POLICY "Admins can manage exchange rates"
  ON exchange_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES 
  ('USD', 'ZWL', 27500.00),
  ('ZWL', 'USD', 0.000036),
  ('USD', 'USD', 1.0),
  ('ZWL', 'ZWL', 1.0)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Create function to convert currency
CREATE OR REPLACE FUNCTION convert_currency(
  amount decimal,
  from_curr text,
  to_curr text
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_rate decimal;
BEGIN
  IF from_curr = to_curr THEN
    RETURN amount;
  END IF;
  
  SELECT rate INTO conversion_rate
  FROM exchange_rates
  WHERE from_currency = from_curr AND to_currency = to_curr;
  
  IF conversion_rate IS NULL THEN
    RETURN amount;
  END IF;
  
  RETURN amount * conversion_rate;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency_code);
CREATE INDEX IF NOT EXISTS idx_orders_currency ON orders(currency_code);
