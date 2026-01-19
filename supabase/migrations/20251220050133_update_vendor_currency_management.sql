/*
  # Vendor Currency Management System

  1. Changes
    - Deactivate all currencies except USD and ZWL
    - Set USD as base currency (exchange_rate = 1.0)
    - Create vendor_currency_rates table for vendor-specific exchange rates
    - Add default vendor currency rates

  2. New Tables
    - `vendor_currency_rates`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendor_profiles)
      - `currency_code` (text, references currencies)
      - `exchange_rate` (numeric, vendor's custom rate)
      - `is_active` (boolean, whether vendor accepts this currency)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on vendor_currency_rates
    - Vendors can only manage their own currency rates
    - Admins can view all currency rates

  4. Notes
    - USD is the base currency (rate always 1.0)
    - Vendors can set their own ZWL rates
    - System only supports USD and ZWL
*/

-- Deactivate all currencies except USD and ZWL
UPDATE currencies 
SET is_active = false 
WHERE code NOT IN ('USD', 'ZWL');

-- Ensure USD is base currency
UPDATE currencies 
SET exchange_rate = 1.0, is_active = true 
WHERE code = 'USD';

-- Ensure ZWL is active
UPDATE currencies 
SET is_active = true 
WHERE code = 'ZWL';

-- Create vendor currency rates table
CREATE TABLE IF NOT EXISTS vendor_currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  currency_code text NOT NULL REFERENCES currencies(code),
  exchange_rate numeric(20, 6) NOT NULL CHECK (exchange_rate > 0),
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, currency_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_currency_rates_vendor 
ON vendor_currency_rates(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_currency_rates_currency 
ON vendor_currency_rates(currency_code);

-- Enable RLS
ALTER TABLE vendor_currency_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can view their own currency rates
CREATE POLICY "Vendors can view own currency rates"
  ON vendor_currency_rates
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can insert their own currency rates
CREATE POLICY "Vendors can insert own currency rates"
  ON vendor_currency_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can update their own currency rates
CREATE POLICY "Vendors can update own currency rates"
  ON vendor_currency_rates
  FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can delete their own currency rates
CREATE POLICY "Vendors can delete own currency rates"
  ON vendor_currency_rates
  FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all currency rates
CREATE POLICY "Admins can view all currency rates"
  ON vendor_currency_rates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_vendor_currency_rate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_vendor_currency_rates_timestamp ON vendor_currency_rates;
CREATE TRIGGER update_vendor_currency_rates_timestamp
  BEFORE UPDATE ON vendor_currency_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_currency_rate_timestamp();

-- Add default currency rates for existing vendors
DO $$
DECLARE
  vendor_record RECORD;
  default_zwl_rate numeric := 322.0;
BEGIN
  FOR vendor_record IN SELECT id FROM vendor_profiles
  LOOP
    -- Add USD rate (always 1.0)
    INSERT INTO vendor_currency_rates (vendor_id, currency_code, exchange_rate, is_active)
    VALUES (vendor_record.id, 'USD', 1.0, true)
    ON CONFLICT (vendor_id, currency_code) DO NOTHING;
    
    -- Add ZWL rate with default system rate
    INSERT INTO vendor_currency_rates (vendor_id, currency_code, exchange_rate, is_active)
    VALUES (vendor_record.id, 'ZWL', default_zwl_rate, true)
    ON CONFLICT (vendor_id, currency_code) DO NOTHING;
  END LOOP;
END $$;

-- Function to get vendor's exchange rate for a currency
CREATE OR REPLACE FUNCTION get_vendor_exchange_rate(
  p_vendor_id uuid,
  p_currency_code text
) RETURNS numeric AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- USD is always 1.0
  IF p_currency_code = 'USD' THEN
    RETURN 1.0;
  END IF;
  
  -- Get vendor's custom rate
  SELECT exchange_rate INTO v_rate
  FROM vendor_currency_rates
  WHERE vendor_id = p_vendor_id 
    AND currency_code = p_currency_code 
    AND is_active = true;
  
  -- If vendor doesn't have a custom rate, use system rate
  IF v_rate IS NULL THEN
    SELECT exchange_rate INTO v_rate
    FROM currencies
    WHERE code = p_currency_code AND is_active = true;
  END IF;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert price using vendor's rate
CREATE OR REPLACE FUNCTION convert_vendor_price(
  p_vendor_id uuid,
  p_amount numeric,
  p_from_currency text,
  p_to_currency text
) RETURNS numeric AS $$
DECLARE
  v_from_rate numeric;
  v_to_rate numeric;
  v_usd_amount numeric;
BEGIN
  -- If same currency, return original amount
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- Get rates
  v_from_rate := get_vendor_exchange_rate(p_vendor_id, p_from_currency);
  v_to_rate := get_vendor_exchange_rate(p_vendor_id, p_to_currency);
  
  -- Convert to USD first, then to target currency
  v_usd_amount := p_amount / v_from_rate;
  RETURN v_usd_amount * v_to_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
