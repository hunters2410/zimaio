-- Comprehensive fix for Shipping Methods RLS
-- Drops all possible conflict policies and re-establishes clean ones.

-- 1. Ensure columns exist (idempotent)
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS logistics_id uuid REFERENCES logistics_profiles(id) ON DELETE SET NULL;

-- 2. Drop potential existing policies
DROP POLICY IF EXISTS "shipping_methods_select" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_insert" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_update" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_delete" ON shipping_methods;
DROP POLICY IF EXISTS "Admins can manage shipping methods" ON shipping_methods;
DROP POLICY IF EXISTS "Logistics can manage own shipping methods" ON shipping_methods;
DROP POLICY IF EXISTS "Anyone can view active shipping methods" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_logistics_managed" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_view_policy" ON shipping_methods;
DROP POLICY IF EXISTS "shipping_methods_admin_policy" ON shipping_methods;
DROP POLICY IF EXISTS "view_shipping_methods" ON shipping_methods;
DROP POLICY IF EXISTS "insert_shipping_methods" ON shipping_methods;
DROP POLICY IF EXISTS "update_shipping_methods" ON shipping_methods;
DROP POLICY IF EXISTS "delete_shipping_methods" ON shipping_methods;

-- 3. Enable RLS
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- A. VIEW: Public (Active only) OR Admin/Owner (All)
CREATE POLICY "view_shipping_methods"
ON shipping_methods FOR SELECT
USING (
    is_active = true 
    OR 
    (logistics_id IS NOT NULL AND EXISTS (SELECT 1 FROM logistics_profiles WHERE user_id = auth.uid() AND id = logistics_id))
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- B. INSERT: Logistics Owner
CREATE POLICY "insert_shipping_methods"
ON shipping_methods FOR INSERT
TO authenticated
WITH CHECK (
    logistics_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM logistics_profiles WHERE user_id = auth.uid() AND id = logistics_id)
);

-- C. UPDATE: Logistics Owner
CREATE POLICY "update_shipping_methods"
ON shipping_methods FOR UPDATE
TO authenticated
USING (
    logistics_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM logistics_profiles WHERE user_id = auth.uid() AND id = logistics_id)
)
WITH CHECK (
    logistics_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM logistics_profiles WHERE user_id = auth.uid() AND id = logistics_id)
);

-- D. DELETE: Logistics Owner
CREATE POLICY "delete_shipping_methods"
ON shipping_methods FOR DELETE
TO authenticated
USING (
    logistics_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM logistics_profiles WHERE user_id = auth.uid() AND id = logistics_id)
);
