
-- 1. Ensure refund table exists and has correct policies (Idempotent)
CREATE TABLE IF NOT EXISTS order_refunds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) NOT NULL,
  customer_id uuid REFERENCES profiles(id) NOT NULL,
  amount numeric NOT NULL,
  reason text,
  status text DEFAULT 'pending', -- pending, approved, rejected, processed
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all refunds" ON order_refunds
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update refunds" ON order_refunds
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Customers can view own refunds" ON order_refunds
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create refunds" ON order_refunds
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
  
-- 2. Create Notification Function
CREATE OR REPLACE FUNCTION notify_refund_request()
RETURNS TRIGGER AS $$
DECLARE
  v_vendor_profile_id uuid;
  v_admin_id uuid;
  v_order_number text;
BEGIN
  -- Get order details
  SELECT vendor_id, order_number INTO v_vendor_profile_id, v_order_number
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Notify All Admins
  INSERT INTO notifications (user_id, title, message, type)
  SELECT id, 'New Refund Request', 'Refund requested for Order #' || v_order_number, 'refund_alert'
  FROM profiles 
  WHERE role = 'admin';

  -- Notify Vendor
  -- We assume orders.vendor_id points to vendor_profiles.id
  INSERT INTO notifications (user_id, title, message, type)
  SELECT user_id, 'Refund Request Received', 'Customer requested refund for Order #' || v_order_number, 'refund_alert'
  FROM vendor_profiles
  WHERE id = v_vendor_profile_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Trigger
DROP TRIGGER IF EXISTS on_refund_request ON order_refunds;
CREATE TRIGGER on_refund_request
AFTER INSERT ON order_refunds
FOR EACH ROW EXECUTE FUNCTION notify_refund_request();
