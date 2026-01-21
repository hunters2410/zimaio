-- ADS_EXTENSIONS.sql
-- Add banned status to enum (Note: Postgres doesn't allow easy dropping from enum, but adding is fine)
ALTER TYPE ad_status ADD VALUE IF NOT EXISTS 'banned';

-- Home Slides Table
CREATE TABLE IF NOT EXISTS home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  button_text text DEFAULT 'Shop Now',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE home_slides ENABLE ROW LEVEL SECURITY;

-- Policies for home_slides
DROP POLICY IF EXISTS "Anyone can view active slides" ON home_slides;
CREATE POLICY "Anyone can view active slides" 
  ON home_slides FOR SELECT 
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage slides" ON home_slides;
CREATE POLICY "Admins manage slides" 
  ON home_slides FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed some default slides if empty
INSERT INTO home_slides (title, subtitle, image_url, link_url, button_text, sort_order)
SELECT 'Ultimate Tech Sale', 'Up to 50% off on all premium electronics', 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg', '/products', 'Explore Sale', 1
WHERE NOT EXISTS (SELECT 1 FROM home_slides);

INSERT INTO home_slides (title, subtitle, image_url, link_url, button_text, sort_order)
SELECT 'Modern Living Essentials', 'Elevate your home with our curated collection', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', '/products', 'Browse Collection', 2
WHERE NOT EXISTS (SELECT 1 FROM home_slides WHERE sort_order = 2);
