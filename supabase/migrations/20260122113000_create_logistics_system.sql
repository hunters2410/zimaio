-- 1. Add 'logistics' role to user_role enum
DO $$ 
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'logistics';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create logistics_profiles table
CREATE TABLE IF NOT EXISTS logistics_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  company_name text NOT NULL,
  description text,
  logo_url text,
  business_email text,
  business_phone text,
  business_address text,
  tax_id text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Modify existing tables to support logistics providers
-- Ensure dependent tables exist
CREATE TABLE IF NOT EXISTS shipping_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    display_name text NOT NULL,
    description text,
    base_cost numeric NOT NULL DEFAULT 0,
    delivery_time_min integer NOT NULL DEFAULT 1,
    delivery_time_max integer NOT NULL DEFAULT 3,
    is_active boolean DEFAULT true,
    is_global boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shipping_zones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    countries text[],
    base_rate numeric NOT NULL,
    per_kg_rate numeric DEFAULT 0,
    is_active boolean DEFAULT true
);

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

-- Add logistics_id columns
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS logistics_id uuid REFERENCES logistics_profiles(id) ON DELETE SET NULL;
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS logistics_id uuid REFERENCES logistics_profiles(id) ON DELETE SET NULL;
ALTER TABLE delivery_drivers ADD COLUMN IF NOT EXISTS logistics_id uuid REFERENCES logistics_profiles(id) ON DELETE CASCADE;

-- 4. Enable RLS on new table
ALTER TABLE logistics_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies for logistics_profiles
CREATE POLICY "Public can view active logistics profiles"
  ON logistics_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Logistics providers can manage own profile"
  ON logistics_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all logistics profiles"
  ON logistics_profiles FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Update shipping_methods policies for logistics
DROP POLICY IF EXISTS "Anyone can view active shipping methods" ON shipping_methods;
CREATE POLICY "Anyone can view active shipping methods"
  ON shipping_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Logistics can manage own shipping methods"
  ON shipping_methods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = shipping_methods.logistics_id
    )
  );

-- 7. Update delivery_drivers policies for logistics
DROP POLICY IF EXISTS "Logistics can manage own drivers" ON delivery_drivers;
CREATE POLICY "Logistics can manage own drivers"
  ON delivery_drivers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM logistics_profiles 
      WHERE logistics_profiles.user_id = auth.uid() 
      AND logistics_profiles.id = delivery_drivers.logistics_id
    )
  );

-- 8. Add Logistics permissions to user_has_permission function (if it exists)
-- Assuming the presence of user_has_permission from previous views

-- 9. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_logistics_profiles_updated_at
    BEFORE UPDATE ON logistics_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
