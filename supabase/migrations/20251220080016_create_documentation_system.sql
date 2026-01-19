/*
  # Create Documentation System

  ## Overview
  This migration creates a comprehensive documentation system that stores structured documentation content for the entire e-commerce platform.

  ## New Tables
  
  ### `documentation_sections`
  Stores documentation sections with hierarchical organization
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Section title
  - `slug` (text, unique) - URL-friendly identifier
  - `content` (text) - Markdown/HTML content
  - `order_index` (integer) - Display order
  - `parent_id` (uuid, nullable) - For nested sections
  - `icon` (text, nullable) - Lucide icon name
  - `is_published` (boolean) - Visibility status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all tables
  - Admins can manage documentation
  - All authenticated users can read published documentation
*/

-- Create documentation sections table
CREATE TABLE IF NOT EXISTS documentation_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  parent_id uuid REFERENCES documentation_sections(id) ON DELETE CASCADE,
  icon text,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documentation_sections ENABLE ROW LEVEL SECURITY;

-- Policies for documentation_sections
CREATE POLICY "Anyone can read published documentation"
  ON documentation_sections
  FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins can manage documentation"
  ON documentation_sections
  FOR ALL
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documentation_sections_slug ON documentation_sections(slug);
CREATE INDEX IF NOT EXISTS idx_documentation_sections_parent ON documentation_sections(parent_id);
CREATE INDEX IF NOT EXISTS idx_documentation_sections_order ON documentation_sections(order_index);