/*
  # Create Analytics System

  ## Overview
  This migration creates a comprehensive analytics system for tracking platform metrics,
  user activity, sales data, and vendor performance over time.

  ## New Tables

  ### 1. `analytics_daily_stats`
  Stores daily aggregated statistics for the platform
  - `id` (uuid, primary key)
  - `date` (date, unique) - The date for these statistics
  - `total_orders` (integer) - Number of orders placed
  - `total_revenue` (decimal) - Total revenue generated
  - `total_customers` (integer) - Total active customers
  - `total_vendors` (integer) - Total active vendors
  - `new_customers` (integer) - New customers registered
  - `new_vendors` (integer) - New vendors registered
  - `new_products` (integer) - New products added
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `analytics_vendor_performance`
  Tracks vendor performance metrics daily
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key) - Reference to vendor
  - `date` (date) - The date for these statistics
  - `total_orders` (integer) - Orders received
  - `total_revenue` (decimal) - Revenue generated
  - `total_products_sold` (integer) - Products sold count
  - `average_rating` (decimal) - Average product rating
  - `created_at` (timestamptz)

  ### 3. `analytics_product_views`
  Tracks product view statistics
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key) - Reference to product
  - `date` (date) - The date for these statistics
  - `view_count` (integer) - Number of views
  - `unique_visitors` (integer) - Unique visitor count
  - `created_at` (timestamptz)

  ### 4. `analytics_order_trends`
  Tracks order trends and patterns
  - `id` (uuid, primary key)
  - `date` (date) - The date for these statistics
  - `hour` (integer) - Hour of day (0-23)
  - `order_count` (integer) - Orders in this hour
  - `total_value` (decimal) - Total value of orders
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all analytics tables
  - Only admins can view analytics data
  - System can insert analytics data automatically

  ## Indexes
  - Date-based indexes for quick time-series queries
  - Vendor and product foreign key indexes
*/

-- Create analytics_daily_stats table
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue decimal(12, 2) DEFAULT 0,
  total_customers integer DEFAULT 0,
  total_vendors integer DEFAULT 0,
  new_customers integer DEFAULT 0,
  new_vendors integer DEFAULT 0,
  new_products integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create analytics_vendor_performance table
CREATE TABLE IF NOT EXISTS analytics_vendor_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue decimal(12, 2) DEFAULT 0,
  total_products_sold integer DEFAULT 0,
  average_rating decimal(3, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, date)
);

-- Create analytics_product_views table
CREATE TABLE IF NOT EXISTS analytics_product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  date date NOT NULL,
  view_count integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, date)
);

-- Create analytics_order_trends table
CREATE TABLE IF NOT EXISTS analytics_order_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  hour integer CHECK (hour >= 0 AND hour <= 23),
  order_count integer DEFAULT 0,
  total_value decimal(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, hour)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date ON analytics_daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_vendor_perf_date ON analytics_vendor_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_vendor_perf_vendor ON analytics_vendor_performance(vendor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_product_views_date ON analytics_product_views(date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_product_views_product ON analytics_product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_order_trends_date ON analytics_order_trends(date DESC);

-- Enable RLS on all analytics tables
ALTER TABLE analytics_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_vendor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_order_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_daily_stats
CREATE POLICY "Admins can view daily stats"
  ON analytics_daily_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for analytics_vendor_performance
CREATE POLICY "Admins can view vendor performance"
  ON analytics_vendor_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own performance"
  ON analytics_vendor_performance FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for analytics_product_views
CREATE POLICY "Admins can view product analytics"
  ON analytics_product_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own product analytics"
  ON analytics_product_views FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      INNER JOIN vendor_profiles vp ON p.vendor_id = vp.id
      WHERE vp.user_id = auth.uid()
    )
  );

-- RLS Policies for analytics_order_trends
CREATE POLICY "Admins can view order trends"
  ON analytics_order_trends FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to generate sample analytics data for the last 30 days
CREATE OR REPLACE FUNCTION generate_sample_analytics_data()
RETURNS void AS $$
DECLARE
  stat_date date;
  days_back integer;
  hour_val integer;
BEGIN
  FOR days_back IN 0..29 LOOP
    stat_date := CURRENT_DATE - days_back;
    
    -- Insert daily stats
    INSERT INTO analytics_daily_stats (
      date, total_orders, total_revenue, total_customers, total_vendors,
      new_customers, new_vendors, new_products
    ) VALUES (
      stat_date,
      floor(random() * 50 + 10)::integer,
      (random() * 5000 + 1000)::decimal(12, 2),
      floor(random() * 20 + 5)::integer,
      floor(random() * 10 + 2)::integer,
      floor(random() * 5)::integer,
      floor(random() * 3)::integer,
      floor(random() * 15 + 5)::integer
    )
    ON CONFLICT (date) DO NOTHING;
    
    -- Insert hourly order trends for peak hours
    FOR hour_val IN 8..20 LOOP
      INSERT INTO analytics_order_trends (
        date, hour, order_count, total_value
      ) VALUES (
        stat_date,
        hour_val,
        floor(random() * 10 + 1)::integer,
        (random() * 500 + 100)::decimal(12, 2)
      )
      ON CONFLICT (date, hour) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate sample data
SELECT generate_sample_analytics_data();
