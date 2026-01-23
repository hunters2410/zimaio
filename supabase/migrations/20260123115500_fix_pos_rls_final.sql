-- Fix POS Order Insert Policy
-- This migration ensures that vendors can create orders using the POS system.
-- It addresses the RLS violation error by explicitly allowing inserts where the vendor_id matches the authenticated user.

-- 1. Ensure customer_id is nullable (required for POS walk-in orders)
DO $$ 
BEGIN
  ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 2. Drop the specific policy if it exists to allow clean recreation
DROP POLICY IF EXISTS "Vendors can create POS orders" ON orders;

-- 3. Create the permissive policy for Vendors
CREATE POLICY "Vendors can create POS orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
  )
);
