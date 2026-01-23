-- Enable Logistics Providers to manage their own Shipping Zones
-- This migration ensures that users with a logistics profile can CRUD shipping zones linked to them.

-- 1. Drop existing policies if they might conflict (though custom ones probably don't exist yet for logs)
-- We'll just add new specific policies.

-- 2. View Policy (Owner can see their own even if inactive, Public/Admin see active)
-- Note: Admin policy likely already handled or needs explicit adding if RLS is strict.
-- Existing policy: "Anyone can view active shipping zones". We'll keep that for public.

CREATE POLICY "Logistics can view own zones"
  ON shipping_zones FOR SELECT
  TO authenticated
  USING (
    logistics_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = shipping_zones.logistics_id
    )
  );

-- 3. Insert Policy
CREATE POLICY "Logistics can insert own zones"
  ON shipping_zones FOR INSERT
  TO authenticated
  WITH CHECK (
    logistics_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = logistics_id
    )
  );

-- 4. Update Policy
CREATE POLICY "Logistics can update own zones"
  ON shipping_zones FOR UPDATE
  TO authenticated
  USING (
    logistics_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = logistics_id
    )
  )
  WITH CHECK (
    logistics_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = logistics_id
    )
  );

-- 5. Delete Policy
CREATE POLICY "Logistics can delete own zones"
  ON shipping_zones FOR DELETE
  TO authenticated
  USING (
    logistics_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = logistics_id
    )
  );
