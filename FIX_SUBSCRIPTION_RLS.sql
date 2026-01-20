-- Enable RLS on vendor_subscriptions if not already enabled
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- Note: vendor_subscriptions.vendor_id references auth.users(id), NOT vendor_profiles.id
-- We must make sure the policy checks against auth.uid() directly.

-- POLICY: Allow vendors to view their own subscriptions
DROP POLICY IF EXISTS "Vendors can view own subscription" ON vendor_subscriptions;
CREATE POLICY "Vendors can view own subscription"
ON vendor_subscriptions FOR SELECT
USING (vendor_id = auth.uid());

-- POLICY: Allow vendors to create their own subscriptions
DROP POLICY IF EXISTS "Vendors can insert own subscription" ON vendor_subscriptions;
CREATE POLICY "Vendors can insert own subscription"
ON vendor_subscriptions FOR INSERT
WITH CHECK (vendor_id = auth.uid());

-- POLICY: Allow vendors to update their own subscriptions
DROP POLICY IF EXISTS "Vendors can update own subscription" ON vendor_subscriptions;
CREATE POLICY "Vendors can update own subscription"
ON vendor_subscriptions FOR UPDATE
USING (vendor_id = auth.uid());

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'vendor_subscriptions';
