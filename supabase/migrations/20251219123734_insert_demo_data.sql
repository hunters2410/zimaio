/*
  # Insert Demo Data for ZimAIO Platform

  ## Overview
  Populate the database with demo data including:
  - Currencies (USD, EUR, GBP, ZAR, ZWL)
  - Languages (English, Shona, Ndebele)
  - Categories (Electronics, Fashion, Home & Garden, Sports, Books, Beauty)
  - Brands (Samsung, Apple, Nike, Adidas, etc.)
  - Static pages (Privacy Policy, Terms & Conditions, Contact Us)
  - Demo vendors with shops
  - Demo products with realistic data
  - Demo customers

  This allows users to immediately explore the platform features.
*/

-- Insert Currencies
INSERT INTO currencies (code, name, symbol, exchange_rate, is_active)
VALUES
  ('USD', 'US Dollar', '$', 1.0, true),
  ('EUR', 'Euro', '€', 0.85, true),
  ('GBP', 'British Pound', '£', 0.73, true),
  ('ZAR', 'South African Rand', 'R', 18.5, true),
  ('ZWL', 'Zimbabwean Dollar', 'Z$', 322.0, true)
ON CONFLICT (code) DO NOTHING;

-- Insert Languages
INSERT INTO languages (code, name, is_active, is_default)
VALUES
  ('en', 'English', true, true),
  ('sn', 'Shona', true, false),
  ('nd', 'Ndebele', true, false)
ON CONFLICT (code) DO NOTHING;

-- Insert Categories
INSERT INTO categories (name, slug, description, is_active, sort_order)
VALUES
  ('Electronics', 'electronics', 'Computers, phones, and electronic devices', true, 1),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories', true, 2),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and gardening supplies', true, 3),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', true, 4),
  ('Books & Media', 'books-media', 'Books, movies, and music', true, 5),
  ('Beauty & Health', 'beauty-health', 'Cosmetics, skincare, and health products', true, 6),
  ('Toys & Games', 'toys-games', 'Toys, games, and hobbies', true, 7),
  ('Automotive', 'automotive', 'Car parts and accessories', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- Insert Brands
INSERT INTO brands (name, slug, is_active)
VALUES
  ('Samsung', 'samsung', true),
  ('Apple', 'apple', true),
  ('Nike', 'nike', true),
  ('Adidas', 'adidas', true),
  ('Sony', 'sony', true),
  ('LG', 'lg', true),
  ('Lenovo', 'lenovo', true),
  ('HP', 'hp', true),
  ('Dell', 'dell', true),
  ('Puma', 'puma', true)
ON CONFLICT (name) DO NOTHING;

-- Insert Static Pages
INSERT INTO pages (slug, title, content, is_active)
VALUES
  ('about', 'About Us', 'Welcome to ZimAIO, your trusted multi-vendor e-commerce platform. We connect buyers with quality sellers across Zimbabwe and beyond.', true),
  ('faq', 'Frequently Asked Questions', 'Find answers to common questions about shopping on ZimAIO, vendor registration, payments, and more.', true),
  ('shipping', 'Shipping Information', 'Learn about our shipping policies, delivery times, and shipping costs for different regions.', true),
  ('returns', 'Returns & Refunds', 'Our return policy allows you to return items within 14 days of delivery. Contact the vendor for return authorization.', true)
ON CONFLICT (slug) DO NOTHING;

-- Note: User accounts need to be created through Supabase Auth, so we'll create a function
-- to help with demo data creation that can be called after auth users are created

-- Create function to setup demo vendor (to be called after user creation)
CREATE OR REPLACE FUNCTION create_demo_vendor_profile(
  p_user_id uuid,
  p_shop_name text,
  p_commission_rate numeric DEFAULT 10
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vendor_id uuid;
BEGIN
  INSERT INTO vendor_profiles (
    user_id,
    shop_name,
    shop_description,
    business_email,
    business_phone,
    kyc_status,
    is_approved,
    commission_rate,
    rating,
    total_sales
  )
  VALUES (
    p_user_id,
    p_shop_name,
    'Quality products at affordable prices. Fast shipping and excellent customer service.',
    'vendor@' || lower(replace(p_shop_name, ' ', '')) || '.com',
    '+263 ' || (random() * 900000000 + 100000000)::bigint::text,
    'approved',
    true,
    p_commission_rate,
    4.5 + (random() * 0.5),
    (random() * 50000)::numeric(10,2)
  )
  RETURNING id INTO v_vendor_id;
  
  RETURN v_vendor_id;
END;
$$;

-- Create function to add demo products
CREATE OR REPLACE FUNCTION create_demo_product(
  p_vendor_id uuid,
  p_category_name text,
  p_brand_name text,
  p_name text,
  p_description text,
  p_price numeric,
  p_stock integer DEFAULT 50,
  p_is_featured boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id uuid;
  v_category_id uuid;
  v_brand_id uuid;
  v_slug text;
BEGIN
  SELECT id INTO v_category_id FROM categories WHERE name = p_category_name LIMIT 1;
  SELECT id INTO v_brand_id FROM brands WHERE name = p_brand_name LIMIT 1;
  
  v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
  
  INSERT INTO products (
    vendor_id,
    category_id,
    brand_id,
    name,
    slug,
    description,
    images,
    base_price,
    stock_quantity,
    sku,
    is_active,
    is_featured,
    weight,
    views_count,
    sales_count
  )
  VALUES (
    p_vendor_id,
    v_category_id,
    v_brand_id,
    p_name,
    v_slug,
    p_description,
    '["https://images.pexels.com/photos/341523/pexels-photo-341523.jpeg"]'::jsonb,
    p_price,
    p_stock,
    'SKU-' || upper(substr(md5(random()::text), 1, 10)),
    true,
    p_is_featured,
    (random() * 5 + 0.5)::numeric(10,2),
    (random() * 1000)::integer,
    (random() * 100)::integer
  )
  RETURNING id INTO v_product_id;
  
  RETURN v_product_id;
END;
$$;

-- Insert sample coupons
DO $$
BEGIN
  INSERT INTO coupons (code, type, value, min_purchase, max_discount, usage_limit, valid_from, valid_until, is_active)
  VALUES
    ('WELCOME10', 'percentage', 10, 50, 20, 100, now(), now() + interval '30 days', true),
    ('SAVE20', 'percentage', 20, 100, 50, 50, now(), now() + interval '15 days', true),
    ('FREESHIP', 'fixed_amount', 5, 30, 5, 200, now(), now() + interval '60 days', true)
  ON CONFLICT (code) DO NOTHING;
END $$;
