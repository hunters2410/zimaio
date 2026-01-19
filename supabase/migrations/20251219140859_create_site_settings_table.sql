/*
  # Create Site Settings Table

  1. New Tables
    - `site_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique) - The setting identifier (e.g., 'font_family')
      - `setting_value` (text) - The setting value
      - `setting_type` (text) - Type of setting (e.g., 'appearance', 'general')
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `site_settings` table
    - Add policy for all users to read settings
    - Add policy for admins to update settings

  3. Initial Data
    - Insert default font family setting
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'general',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON site_settings
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

CREATE POLICY "Admins can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

INSERT INTO site_settings (setting_key, setting_value, setting_type)
VALUES 
  ('font_family', 'Inter', 'appearance'),
  ('primary_color', 'green', 'appearance')
ON CONFLICT (setting_key) DO NOTHING;
