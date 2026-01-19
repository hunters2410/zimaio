/*
  # VAT System and Admin Product Management

  Creates VAT configuration tables and adds admin management fields to products.
*/

-- VAT Settings Table
CREATE TABLE IF NOT EXISTS vat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  default_rate decimal(5,2) DEFAULT 15.00,
  applies_to_products boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT true,
  updated_by uuid,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Product VAT Overrides Table
CREATE TABLE IF NOT EXISTS product_vat_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  vat_rate decimal(5,2),
  vat_exempt boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Insert default VAT settings
INSERT INTO vat_settings (is_enabled, default_rate)
VALUES (false, 15.00)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE vat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_vat_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "vat_select" ON vat_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "vat_update" ON vat_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vat_override_select" ON product_vat_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "vat_override_insert" ON product_vat_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vat_override_update" ON product_vat_overrides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vat_override_delete" ON product_vat_overrides FOR DELETE TO authenticated USING (true);

-- Add product admin management fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'admin_approved') THEN
    ALTER TABLE products ADD COLUMN admin_approved boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'admin_notes') THEN
    ALTER TABLE products ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rejection_reason') THEN
    ALTER TABLE products ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vat_enabled ON vat_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_vat_override_product ON product_vat_overrides(product_id);
CREATE INDEX IF NOT EXISTS idx_product_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_created ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_product_approved ON products(admin_approved);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds(created_at);
