/*
  # Create Delivery System

  1. New Tables
    - `delivery_drivers`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles) - The driver's profile
      - `driver_name` (text)
      - `phone_number` (text)
      - `vehicle_type` (text) - e.g., 'motorcycle', 'car', 'van'
      - `vehicle_number` (text)
      - `is_available` (boolean)
      - `current_location` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `deliveries`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references orders)
      - `driver_id` (uuid, references delivery_drivers, nullable)
      - `customer_id` (uuid, references profiles)
      - `vendor_id` (uuid, references profiles)
      - `delivery_address` (text)
      - `customer_phone` (text)
      - `delivery_status` (text) - 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'
      - `pickup_time` (timestamptz, nullable)
      - `delivery_time` (timestamptz, nullable)
      - `delivery_notes` (text, nullable)
      - `tracking_number` (text, unique)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `delivery_tracking_history`
      - `id` (uuid, primary key)
      - `delivery_id` (uuid, references deliveries)
      - `status` (text)
      - `location` (text, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Drivers can read/update their own data
    - Customers can read their own deliveries
    - Vendors can read deliveries for their orders
    - Admins can manage everything

  3. Functions
    - Create function to generate tracking numbers
    - Create function to update delivery status and add to history
*/

-- Create delivery_drivers table
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  driver_name text NOT NULL,
  phone_number text NOT NULL,
  vehicle_type text DEFAULT 'motorcycle',
  vehicle_number text NOT NULL,
  is_available boolean DEFAULT true,
  current_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES delivery_drivers(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  delivery_address text NOT NULL,
  customer_phone text NOT NULL,
  delivery_status text DEFAULT 'pending',
  pickup_time timestamptz,
  delivery_time timestamptz,
  delivery_notes text,
  tracking_number text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create delivery_tracking_history table
CREATE TABLE IF NOT EXISTS delivery_tracking_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES deliveries(id) ON DELETE CASCADE,
  status text NOT NULL,
  location text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_tracking_history ENABLE ROW LEVEL SECURITY;

-- Policies for delivery_drivers
CREATE POLICY "Admins can manage delivery drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Drivers can read own data"
  ON delivery_drivers
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Drivers can update own data"
  ON delivery_drivers
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Policies for deliveries
CREATE POLICY "Customers can read own deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can read their deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Drivers can read assigned deliveries"
  ON deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = deliveries.driver_id
      AND delivery_drivers.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can create deliveries"
  ON deliveries
  FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Drivers can update assigned deliveries"
  ON deliveries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = deliveries.driver_id
      AND delivery_drivers.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_drivers
      WHERE delivery_drivers.id = deliveries.driver_id
      AND delivery_drivers.profile_id = auth.uid()
    )
  );

-- Policies for delivery_tracking_history
CREATE POLICY "Anyone can read delivery tracking"
  ON delivery_tracking_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries
      WHERE deliveries.id = delivery_tracking_history.delivery_id
      AND (
        deliveries.customer_id = auth.uid()
        OR deliveries.vendor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM delivery_drivers
          WHERE delivery_drivers.id = deliveries.driver_id
          AND delivery_drivers.profile_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "System can insert tracking history"
  ON delivery_tracking_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  tracking_num text;
BEGIN
  tracking_num := 'TRK' || LPAD(floor(random() * 999999999)::text, 9, '0');
  RETURN tracking_num;
END;
$$;

-- Function to update delivery status
CREATE OR REPLACE FUNCTION update_delivery_status(
  delivery_id_param uuid,
  new_status text,
  location_param text DEFAULT NULL,
  notes_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE deliveries
  SET 
    delivery_status = new_status,
    updated_at = now(),
    pickup_time = CASE WHEN new_status = 'picked_up' THEN now() ELSE pickup_time END,
    delivery_time = CASE WHEN new_status = 'delivered' THEN now() ELSE delivery_time END
  WHERE id = delivery_id_param;
  
  INSERT INTO delivery_tracking_history (delivery_id, status, location, notes)
  VALUES (delivery_id_param, new_status, location_param, notes_param);
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_vendor ON deliveries(vendor_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_tracking ON deliveries(tracking_number);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_history_delivery ON delivery_tracking_history(delivery_id);
