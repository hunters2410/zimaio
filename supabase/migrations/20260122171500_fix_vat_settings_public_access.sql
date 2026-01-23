-- Fix RLS policies for VAT settings to allow public access (for Guests)
DROP POLICY IF EXISTS "vat_select" ON vat_settings;
CREATE POLICY "vat_select" ON vat_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "vat_override_select" ON product_vat_overrides;
CREATE POLICY "vat_override_select" ON product_vat_overrides FOR SELECT USING (true);
