-- ADS_MODULE.sql
-- Module for Vendor Ads Management

-- 1. Create Types
DO $$ BEGIN
    CREATE TYPE ad_type AS ENUM ('banner', 'sidebar', 'popup', 'featured');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ad_status AS ENUM ('pending', 'active', 'rejected', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create vendor_ads table
CREATE TABLE IF NOT EXISTS vendor_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  ad_type ad_type DEFAULT 'banner',
  status ad_status DEFAULT 'pending',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE vendor_ads ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Public: View active ads
DROP POLICY IF EXISTS "Public view active ads" ON vendor_ads;
CREATE POLICY "Public view active ads" 
  ON vendor_ads FOR SELECT 
  USING (status = 'active' AND now() BETWEEN start_date AND end_date);

-- Vendors: View their own ads
DROP POLICY IF EXISTS "Vendors view own ads" ON vendor_ads;
CREATE POLICY "Vendors view own ads" 
  ON vendor_ads FOR SELECT 
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

-- Vendors: Create their own ads (Permission check will be handled in app logic via package check, or trigger if strict)
DROP POLICY IF EXISTS "Vendors insert own ads" ON vendor_ads;
CREATE POLICY "Vendors insert own ads" 
  ON vendor_ads FOR INSERT 
  WITH CHECK (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

-- Vendors: Update their own ads
DROP POLICY IF EXISTS "Vendors update own ads" ON vendor_ads;
CREATE POLICY "Vendors update own ads" 
  ON vendor_ads FOR UPDATE 
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

-- Vendors: Delete their own ads
DROP POLICY IF EXISTS "Vendors delete own ads" ON vendor_ads;
CREATE POLICY "Vendors delete own ads" 
  ON vendor_ads FOR DELETE 
  USING (vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid()));

-- Admins: Full Access
DROP POLICY IF EXISTS "Admins select all ads" ON vendor_ads;
CREATE POLICY "Admins select all ads" 
  ON vendor_ads FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins update all ads" ON vendor_ads;
CREATE POLICY "Admins update all ads" 
  ON vendor_ads FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins delete all ads" ON vendor_ads;
CREATE POLICY "Admins delete all ads" 
  ON vendor_ads FOR DELETE 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Functions for tracking
CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE vendor_ads
  SET clicks = clicks + 1
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_ids uuid[])
RETURNS void AS $$
BEGIN
  UPDATE vendor_ads
  SET impressions = impressions + 1
  WHERE id = ANY(ad_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
