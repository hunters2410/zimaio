-- Fix Refund Module Database Objects and Permissions

-- 1. Ensure refund_status Enum Exists
DO $$ BEGIN
    CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure order_refunds Table Exists
CREATE TABLE IF NOT EXISTS order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  amount numeric NOT NULL,
  status refund_status DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- View Policy: Customers view theirs, Vendors view theirs
DROP POLICY IF EXISTS "Users can view own refunds" ON order_refunds;
CREATE POLICY "Users can view own refunds"
  ON order_refunds FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert Policy: Customers can request refunds
DROP POLICY IF EXISTS "Customers can create refund requests" ON order_refunds;
CREATE POLICY "Customers can create refund requests"
  ON order_refunds FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Update Policy: Vendors can approve/reject/process refunds sent to them
DROP POLICY IF EXISTS "Vendors can update refund status" ON order_refunds;
CREATE POLICY "Vendors can update refund status"
  ON order_refunds FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

-- Update Policy: Admins can update any refund
DROP POLICY IF EXISTS "Admins can update refunds" ON order_refunds;
CREATE POLICY "Admins can update refunds"
  ON order_refunds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
