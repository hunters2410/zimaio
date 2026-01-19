/*
  # Create Navigation Menu Items Table

  1. New Tables
    - `navigation_menu_items`
      - `id` (uuid, primary key)
      - `label` (text) - Display text for the menu item
      - `url` (text) - Link URL
      - `icon` (text, optional) - Icon name if any
      - `order_position` (integer) - Display order
      - `is_active` (boolean) - Whether the item is visible
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `navigation_menu_items` table
    - Add policy for public users to read active menu items
    - Add policy for admins to manage menu items
  
  3. Initial Data
    - Insert default navigation menu items (Categories, Brands, Vendors, Sell On ZIMAIO)
*/

CREATE TABLE IF NOT EXISTS navigation_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE navigation_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active navigation items"
  ON navigation_menu_items
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can insert navigation items"
  ON navigation_menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update navigation items"
  ON navigation_menu_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete navigation items"
  ON navigation_menu_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default navigation menu items
INSERT INTO navigation_menu_items (label, url, icon, order_position, is_active) VALUES
  ('CATEGORIES', '/categories', 'Menu', 1, true),
  ('BRANDS', '/brands', NULL, 2, true),
  ('VENDORS', '/vendors', NULL, 3, true),
  ('SELL ON ZIMAIO', '/vendor-signup', 'Package', 4, true);
