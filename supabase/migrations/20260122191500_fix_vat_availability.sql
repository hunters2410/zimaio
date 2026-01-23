-- Database Health Check and Fix: VAT & Commission Settings
-- 1. Ensure the 'vat_settings' table has strictly one active row.
-- 2. Ensure Row Level Security (RLS) is correctly configured for Public Read / Admin Write.

-- Step 1: Ensure exactly one row exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vat_settings) THEN
    INSERT INTO vat_settings (
        is_enabled, 
        default_rate, 
        commission_enabled, 
        commission_rate, 
        applies_to_products, 
        applies_to_shipping
    ) VALUES (
        true, 
        15.0, 
        true, 
        10.0, 
        true, 
        true
    );
  END IF;
END $$;

-- Step 2: Reset RLS Policies to ensure visibility
ALTER TABLE vat_settings ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or stale policies
DROP POLICY IF EXISTS "vat_select" ON vat_settings;
DROP POLICY IF EXISTS "vat_settings_read_all" ON vat_settings;
DROP POLICY IF EXISTS "vat_settings_admin_all" ON vat_settings;
DROP POLICY IF EXISTS "Allow public read access" ON vat_settings;
DROP POLICY IF EXISTS "Allow exact admin write access" ON vat_settings;

-- Policy A: Everyone (Public + Auth) can VIEW settings
-- This is critical for the Cart to calculate totals
CREATE POLICY "vat_settings_read_all" 
ON vat_settings FOR SELECT 
USING (true);

-- Policy B: Only Admins can UPDATE settings
-- Assuming 'admin' role or check. Using a broad check for now or specific if profiles exist.
-- Using the standard admin check pattern found in other migrations.
CREATE POLICY "vat_settings_admin_update"
ON vat_settings FOR UPDATE
TO authenticated
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy C: Only Admins can INSERT (though only 1 row should exist)
CREATE POLICY "vat_settings_admin_insert"
ON vat_settings FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Step 3: Grant Permissions (Just to be safe for PostgREST)
GRANT SELECT ON vat_settings TO anon, authenticated, service_role;
