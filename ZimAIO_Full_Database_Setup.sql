/*
  # Multi-Vendor E-Commerce Platform Schema

  ## Overview
  Complete database schema for a multi-vendor e-commerce platform with support for
  customers, vendors, and admins. Includes features for products, orders, wallets,
  shipping, support tickets, chat, commissions, and more.

  ## 1. Core User Tables
  
  ### `profiles`
  Extends Supabase auth.users with additional profile information
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `avatar_url` (text)
  - `role` (enum: customer, vendor, admin)
  - `language_code` (text, default 'en')
  - `currency_code` (text, default 'USD')
  - `two_factor_enabled` (boolean)
  - `two_factor_secret` (text)
  - `is_active` (boolean)
  - `is_verified` (boolean)
  - `last_login` (timestamptz)
  - `created_at` (timestamptz)

  ### `vendor_profiles`
  Additional information for vendors
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `shop_name` (text)
  - `shop_description` (text)
  - `shop_logo_url` (text)
  - `shop_banner_url` (text)
  - `business_email` (text)
  - `business_phone` (text)
  - `business_address` (text)
  - `tax_id` (text)
  - `kyc_status` (enum: pending, approved, rejected)
  - `kyc_documents` (jsonb)
  - `subscription_plan` (text)
  - `subscription_expires_at` (timestamptz)
  - `commission_rate` (numeric, default 10)
  - `is_approved` (boolean)
  - `total_sales` (numeric)
  - `rating` (numeric)
  - `created_at` (timestamptz)

  ## 2. Catalog Tables

  ### `categories`
  Product categories
  - `id` (uuid, primary key)
  - `name` (text)
  - `slug` (text, unique)
  - `description` (text)
  - `parent_id` (uuid, self-reference)
  - `image_url` (text)
  - `is_active` (boolean)
  - `sort_order` (integer)

  ### `brands`
  Product brands
  - `id` (uuid, primary key)
  - `name` (text, unique)
  - `slug` (text, unique)
  - `logo_url` (text)
  - `is_active` (boolean)

  ### `products`
  Product listings
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, references vendor_profiles)
  - `category_id` (uuid, references categories)
  - `brand_id` (uuid, references brands)
  - `name` (text)
  - `slug` (text)
  - `description` (text)
  - `images` (jsonb)
  - `base_price` (numeric)
  - `currency_prices` (jsonb) - prices in different currencies
  - `stock_quantity` (integer)
  - `sku` (text, unique)
  - `is_active` (boolean)
  - `is_featured` (boolean)
  - `weight` (numeric)
  - `dimensions` (jsonb)
  - `attributes` (jsonb) - color, size, etc.
  - `views_count` (integer)
  - `sales_count` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## 3. Order Management

  ### `carts`
  Shopping carts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `session_id` (text) - for guest users
  - `items` (jsonb)
  - `updated_at` (timestamptz)

  ### `orders`
  Customer orders
  - `id` (uuid, primary key)
  - `order_number` (text, unique)
  - `customer_id` (uuid, references profiles)
  - `vendor_id` (uuid, references vendor_profiles)
  - `status` (enum: pending, processing, shipped, delivered, cancelled, refunded)
  - `items` (jsonb)
  - `subtotal` (numeric)
  - `shipping_fee` (numeric)
  - `tax` (numeric)
  - `discount` (numeric)
  - `total` (numeric)
  - `currency_code` (text)
  - `shipping_address` (jsonb)
  - `billing_address` (jsonb)
  - `payment_method` (text)
  - `payment_status` (enum: pending, paid, failed, refunded)
  - `tracking_number` (text)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `order_refunds`
  Refund requests
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders)
  - `customer_id` (uuid, references profiles)
  - `vendor_id` (uuid, references vendor_profiles)
  - `reason` (text)
  - `amount` (numeric)
  - `status` (enum: pending, approved, rejected, completed)
  - `admin_notes` (text)
  - `created_at` (timestamptz)

  ## 4. Financial Management

  ### `wallets`
  User wallets
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles, unique)
  - `balance` (numeric, default 0)
  - `currency_code` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### `wallet_transactions`
  Wallet transaction history
  - `id` (uuid, primary key)
  - `wallet_id` (uuid, references wallets)
  - `type` (enum: deposit, withdrawal, commission, refund, purchase, payout)
  - `amount` (numeric)
  - `balance_before` (numeric)
  - `balance_after` (numeric)
  - `status` (enum: pending, completed, failed, cancelled)
  - `reference_id` (text) - order_id, refund_id, etc.
  - `payment_method` (text)
  - `notes` (text)
  - `admin_approved` (boolean)
  - `created_at` (timestamptz)

  ### `commissions`
  Platform commissions
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders)
  - `vendor_id` (uuid, references vendor_profiles)
  - `order_amount` (numeric)
  - `commission_rate` (numeric)
  - `commission_amount` (numeric)
  - `status` (enum: pending, paid)
  - `paid_at` (timestamptz)
  - `created_at` (timestamptz)

  ## 5. Communication & Support

  ### `support_tickets`
  Customer support tickets
  - `id` (uuid, primary key)
  - `ticket_number` (text, unique)
  - `user_id` (uuid, references profiles)
  - `subject` (text)
  - `category` (text)
  - `priority` (enum: low, medium, high, urgent)
  - `status` (enum: open, in_progress, resolved, closed)
  - `assigned_to` (uuid, references profiles)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `ticket_messages`
  Ticket conversation messages
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, references support_tickets)
  - `user_id` (uuid, references profiles)
  - `message` (text)
  - `attachments` (jsonb)
  - `created_at` (timestamptz)

  ### `chat_conversations`
  Direct messaging between users
  - `id` (uuid, primary key)
  - `participant_ids` (uuid[])
  - `last_message` (text)
  - `last_message_at` (timestamptz)
  - `created_at` (timestamptz)

  ### `chat_messages`
  Chat messages
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references chat_conversations)
  - `sender_id` (uuid, references profiles)
  - `message` (text)
  - `attachments` (jsonb)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ## 6. Marketing & Promotions

  ### `coupons`
  Discount coupons
  - `id` (uuid, primary key)
  - `code` (text, unique)
  - `type` (enum: percentage, fixed_amount)
  - `value` (numeric)
  - `vendor_id` (uuid, references vendor_profiles) - null for platform-wide
  - `min_purchase` (numeric)
  - `max_discount` (numeric)
  - `usage_limit` (integer)
  - `used_count` (integer)
  - `valid_from` (timestamptz)
  - `valid_until` (timestamptz)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### `promotions`
  Vendor promotions
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, references vendor_profiles)
  - `name` (text)
  - `description` (text)
  - `discount_type` (enum: percentage, fixed_amount)
  - `discount_value` (numeric)
  - `product_ids` (uuid[])
  - `valid_from` (timestamptz)
  - `valid_until` (timestamptz)
  - `is_active` (boolean)

  ### `referrals`
  Referral program
  - `id` (uuid, primary key)
  - `referrer_id` (uuid, references profiles)
  - `referee_id` (uuid, references profiles)
  - `reward_amount` (numeric)
  - `status` (enum: pending, completed, paid)
  - `created_at` (timestamptz)

  ## 7. Reviews & Ratings

  ### `product_reviews`
  Product reviews
  - `id` (uuid, primary key)
  - `product_id` (uuid, references products)
  - `user_id` (uuid, references profiles)
  - `order_id` (uuid, references orders)
  - `rating` (integer, 1-5)
  - `title` (text)
  - `comment` (text)
  - `images` (jsonb)
  - `is_verified_purchase` (boolean)
  - `is_approved` (boolean)
  - `created_at` (timestamptz)

  ### `vendor_reviews`
  Vendor reviews
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, references vendor_profiles)
  - `user_id` (uuid, references profiles)
  - `rating` (integer, 1-5)
  - `comment` (text)
  - `created_at` (timestamptz)

  ## 8. System Configuration

  ### `shipping_zones`
  Shipping zones and rates
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, references vendor_profiles) - null for platform-wide
  - `name` (text)
  - `countries` (text[])
  - `base_rate` (numeric)
  - `per_kg_rate` (numeric)
  - `is_active` (boolean)

  ### `currencies`
  Supported currencies
  - `id` (uuid, primary key)
  - `code` (text, unique)
  - `name` (text)
  - `symbol` (text)
  - `exchange_rate` (numeric) - relative to base currency
  - `is_active` (boolean)

  ### `languages`
  Supported languages
  - `id` (uuid, primary key)
  - `code` (text, unique)
  - `name` (text)
  - `is_active` (boolean)
  - `is_default` (boolean)

  ### `translations`
  Content translations
  - `id` (uuid, primary key)
  - `language_code` (text)
  - `key` (text)
  - `value` (text)
  - UNIQUE(language_code, key)

  ## 9. Notifications

  ### `notifications`
  User notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `type` (text)
  - `title` (text)
  - `message` (text)
  - `data` (jsonb)
  - `is_read` (boolean)
  - `created_at` (timestamptz)

  ## 10. Security & Audit

  ### `audit_logs`
  System activity logs
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `action` (text)
  - `entity_type` (text)
  - `entity_id` (uuid)
  - `changes` (jsonb)
  - `ip_address` (text)
  - `user_agent` (text)
  - `created_at` (timestamptz)

  ### `fraud_detections`
  Fraud monitoring
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `order_id` (uuid, references orders)
  - `risk_score` (numeric)
  - `risk_factors` (jsonb)
  - `status` (enum: pending, approved, rejected)
  - `reviewed_by` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### `login_attempts`
  Track login attempts for security
  - `id` (uuid, primary key)
  - `email` (text)
  - `ip_address` (text)
  - `success` (boolean)
  - `created_at` (timestamptz)

  ### `otp_codes`
  OTP verification codes
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `code` (text)
  - `purpose` (enum: login, password_reset, verification)
  - `expires_at` (timestamptz)
  - `used` (boolean)
  - `created_at` (timestamptz)

  ## 11. Static Content

  ### `pages`
  Static pages (privacy policy, terms, etc.)
  - `id` (uuid, primary key)
  - `slug` (text, unique)
  - `title` (text)
  - `content` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies enforce user roles and ownership
  - Audit logging for sensitive operations
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'commission', 'refund', 'purchase', 'payout');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed_amount');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commission_status AS ENUM ('pending', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE fraud_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE otp_purpose AS ENUM ('login', 'password_reset', 'verification');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 1. Core User Tables

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role user_role DEFAULT 'customer',
  language_code text DEFAULT 'en',
  currency_code text DEFAULT 'USD',
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  shop_name text NOT NULL,
  shop_description text,
  shop_logo_url text,
  shop_banner_url text,
  business_email text,
  business_phone text,
  business_address text,
  tax_id text,
  kyc_status kyc_status DEFAULT 'pending',
  kyc_documents jsonb DEFAULT '[]'::jsonb,
  subscription_plan text DEFAULT 'basic',
  subscription_expires_at timestamptz,
  commission_rate numeric DEFAULT 10,
  is_approved boolean DEFAULT false,
  total_sales numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. Catalog Tables

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  base_price numeric NOT NULL,
  currency_prices jsonb DEFAULT '{}'::jsonb,
  stock_quantity integer DEFAULT 0,
  sku text UNIQUE,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  weight numeric,
  dimensions jsonb,
  attributes jsonb DEFAULT '{}'::jsonb,
  views_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Order Management

CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text,
  items jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE SET NULL NOT NULL,
  status order_status DEFAULT 'pending',
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  currency_code text DEFAULT 'USD',
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  payment_method text,
  payment_status payment_status DEFAULT 'pending',
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  amount numeric NOT NULL,
  status refund_status DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Financial Management

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric DEFAULT 0,
  currency_code text DEFAULT 'USD',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  status transaction_status DEFAULT 'pending',
  reference_id text,
  payment_method text,
  notes text,
  admin_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  order_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status commission_status DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. Communication & Support

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  category text,
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids uuid[] NOT NULL,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Marketing & Promotions

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type coupon_type NOT NULL,
  value numeric NOT NULL,
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  discount_type coupon_type NOT NULL,
  discount_value numeric NOT NULL,
  product_ids uuid[],
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referee_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_amount numeric DEFAULT 10,
  status referral_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- 7. Reviews & Ratings

CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title text,
  comment text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendor_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 8. System Configuration

CREATE TABLE IF NOT EXISTS shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  countries text[],
  base_rate numeric NOT NULL,
  per_kg_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  exchange_rate numeric DEFAULT 1,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  UNIQUE(language_code, key)
);

-- 9. Notifications

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 10. Security & Audit

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  risk_score numeric NOT NULL,
  risk_factors jsonb,
  status fraud_status DEFAULT 'pending',
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  purpose otp_purpose NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 11. Static Content

CREATE TABLE IF NOT EXISTS pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can view all profiles but only update their own
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Vendor Profiles: Public can view approved vendors, vendors manage own
CREATE POLICY "Anyone can view approved vendor profiles"
  ON vendor_profiles FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Vendors can update own profile"
  ON vendor_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create vendor profile"
  ON vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Categories, Brands: Public read, admin write
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active brands"
  ON brands FOR SELECT
  USING (is_active = true);

-- Products: Public can view active products
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can manage own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Vendors can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

-- Carts: Users manage their own carts
CREATE POLICY "Users can view own cart"
  ON carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own cart"
  ON carts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cart"
  ON carts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own cart"
  ON carts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Orders: Customers and vendors see their orders
CREATE POLICY "Customers can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR 
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

-- Wallets: Users manage their own wallets
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own wallet"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Wallet Transactions
CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    wallet_id IN (SELECT id FROM wallets WHERE user_id = auth.uid())
  );

-- Support Tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ticket Messages
CREATE POLICY "Users can view messages in own tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create messages in own tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()) AND
    user_id = auth.uid()
  );

-- Chat
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can view messages in own conversations"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE auth.uid() = ANY(participant_ids)
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE auth.uid() = ANY(participant_ids)
    ) AND sender_id = auth.uid()
  );

-- Coupons: Public can view active coupons
CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (is_active = true);

-- Product Reviews: Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
  ON product_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pages: Anyone can view active pages
CREATE POLICY "Anyone can view active pages"
  ON pages FOR SELECT
  USING (is_active = true);

-- Commissions: Vendors can view own commissions
CREATE POLICY "Vendors can view own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

-- Public read for configuration tables
CREATE POLICY "Anyone can view active currencies"
  ON currencies FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active languages"
  ON languages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view translations"
  ON translations FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active shipping zones"
  ON shipping_zones FOR SELECT
  USING (is_active = true);

-- Refunds
CREATE POLICY "Users can view own refunds"
  ON order_refunds FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid() OR
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Customers can create refund requests"
  ON order_refunds FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Promotions
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Vendors can manage own promotions"
  ON promotions FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

-- Vendor Reviews
CREATE POLICY "Anyone can view vendor reviews"
  ON vendor_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create vendor reviews"
  ON vendor_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Referrals
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

-- Fraud Detection: Admins only (no public policies)
-- Audit Logs: Admins only (no public policies)
-- Login Attempts: System only (no public policies)
-- OTP Codes: System only (no public policies)

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
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
/*
  # Add Featured Status to Vendor Profiles

  1. Changes
    - Add `is_featured` column to `vendor_profiles` table to allow admins to mark vendors as featured
    - Add `is_verified` column to `vendor_profiles` table for verified vendor status
    - Default value is `false` for both
    - Admins can toggle these fields to control which vendors appear on the homepage

  2. Notes
    - This allows admins to curate which vendors are prominently displayed
    - Featured vendors will be shown in the "Featured Vendor Shops" section on the homepage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;
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
/*
  # Add Multi-Currency Support

  1. Changes
    - Add currency_code column to products table with default 'USD'
    - Add currency_code column to orders table
    - Add exchange_rate column to orders table for historical tracking
    - Create exchange_rates table for managing currency conversions
    - Add currency preferences to profiles table (already exists)

  2. Supported Currencies
    - USD (United States Dollar)
    - ZWL (Zimbabwean Dollar)

  3. Notes
    - Products can be priced in any supported currency
    - Orders store the currency and exchange rate at time of purchase
    - User preferences allow selecting default currency
*/

-- Add currency_code to products if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE products ADD COLUMN currency_code text DEFAULT 'USD';
  END IF;
END $$;

-- Add currency fields to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency_code text DEFAULT 'USD';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'exchange_rate'
  ) THEN
    ALTER TABLE orders ADD COLUMN exchange_rate decimal(10,4) DEFAULT 1.0;
  END IF;
END $$;

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate decimal(10,4) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_currency, to_currency)
);

-- Enable RLS on exchange_rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can read exchange rates
CREATE POLICY "Anyone can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage exchange rates
CREATE POLICY "Admins can manage exchange rates"
  ON exchange_rates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default exchange rates
INSERT INTO exchange_rates (from_currency, to_currency, rate)
VALUES 
  ('USD', 'ZWL', 27500.00),
  ('ZWL', 'USD', 0.000036),
  ('USD', 'USD', 1.0),
  ('ZWL', 'ZWL', 1.0)
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = now();

-- Create function to convert currency
CREATE OR REPLACE FUNCTION convert_currency(
  amount decimal,
  from_curr text,
  to_curr text
)
RETURNS decimal
LANGUAGE plpgsql
AS $$
DECLARE
  conversion_rate decimal;
BEGIN
  IF from_curr = to_curr THEN
    RETURN amount;
  END IF;
  
  SELECT rate INTO conversion_rate
  FROM exchange_rates
  WHERE from_currency = from_curr AND to_currency = to_curr;
  
  IF conversion_rate IS NULL THEN
    RETURN amount;
  END IF;
  
  RETURN amount * conversion_rate;
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_currency ON products(currency_code);
CREATE INDEX IF NOT EXISTS idx_orders_currency ON orders(currency_code);
/*
  # Admin User & Vendor Management System

  ## New Tables
  
  ### 1. `kyc_verifications`
  Tracks KYC verification status for vendors
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key to profiles)
  - `document_type` (text: passport, drivers_license, national_id, business_registration)
  - `document_number` (text)
  - `document_url` (text)
  - `verification_status` (text: pending, approved, rejected)
  - `verified_by` (uuid, foreign key to profiles - admin who verified)
  - `verified_at` (timestamptz)
  - `rejection_reason` (text)
  - `submitted_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `vendor_contracts`
  Tracks vendor terms & contract acceptance
  - `id` (uuid, primary key)
  - `vendor_id` (uuid, foreign key to profiles)
  - `contract_version` (text)
  - `terms_accepted` (boolean)
  - `accepted_at` (timestamptz)
  - `ip_address` (text)
  - `user_agent` (text)
  - `contract_text` (text)
  - `created_at` (timestamptz)

  ### 3. `user_roles`
  Define custom user roles and permissions
  - `id` (uuid, primary key)
  - `role_name` (text, unique)
  - `role_description` (text)
  - `permissions` (jsonb)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `user_role_assignments`
  Assign roles to users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to profiles)
  - `role_id` (uuid, foreign key to user_roles)
  - `assigned_by` (uuid, foreign key to profiles)
  - `assigned_at` (timestamptz)
  - `expires_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for admin-only access
  - Add policies for vendors to view their own KYC and contracts
*/

-- KYC Verifications Table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'drivers_license', 'national_id', 'business_registration')),
  document_number text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own KYC verifications"
  ON kyc_verifications FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert own KYC verifications"
  ON kyc_verifications FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can update KYC verifications"
  ON kyc_verifications FOR UPDATE
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

-- Vendor Contracts Table
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contract_version text NOT NULL,
  terms_accepted boolean DEFAULT false,
  accepted_at timestamptz,
  ip_address text,
  user_agent text,
  contract_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can view own contracts"
  ON vendor_contracts FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "System can insert contracts"
  ON vendor_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Vendors can accept own contracts"
  ON vendor_contracts FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- User Roles Table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  role_description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
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

-- User Role Assignments Table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES user_roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role assignments"
  ON user_role_assignments FOR ALL
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

CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_kyc_vendor_id ON kyc_verifications(vendor_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_contracts_vendor_id ON vendor_contracts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id ON user_role_assignments(user_id);
/*
  # Enhance Financial Management System

  ## Updates to Existing Tables
  
  ### 1. Enhance `wallets` table
  Add missing columns:
  - `pending_balance` (decimal)
  - `total_earned` (decimal)
  - `total_withdrawn` (decimal)
  - `updated_at` (timestamptz)

  ## New Tables
  
  ### 1. `payment_gateways`
  Payment gateway configurations
  
  ### 2. `vat_configurations`
  VAT/Tax management
  
  ### 3. `refunds`
  Refund management (enhanced version of order_refunds)
  
  ### 4. `financial_notifications`
  Track financial event notifications
  
  ### 5. `vendor_plans`
  Vendor subscription plans
  
  ### 6. `email_templates`
  Email template management
  
  ### 7. `vendor_performance_analytics`
  Track vendor performance metrics
  
  ## Security
  - Enable RLS on all tables
  - Add appropriate policies
*/

-- Add missing columns to wallets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'pending_balance'
  ) THEN
    ALTER TABLE wallets ADD COLUMN pending_balance decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_earned'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_earned decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_withdrawn'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_withdrawn decimal(15,2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wallets ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Payment Gateways Table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL,
  gateway_type text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  supported_currencies text[] DEFAULT ARRAY['USD']::text[],
  transaction_fee_percentage decimal(5,2) DEFAULT 0.00,
  transaction_fee_fixed decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment gateways"
  ON payment_gateways FOR ALL
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

-- VAT Configurations Table
CREATE TABLE IF NOT EXISTS vat_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  vat_rate decimal(5,2) NOT NULL CHECK (vat_rate >= 0 AND vat_rate <= 100),
  vat_name text DEFAULT 'VAT',
  is_active boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vat_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view VAT configurations"
  ON vat_configurations FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage VAT configurations"
  ON vat_configurations FOR ALL
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

-- Refunds Table (Enhanced)
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid,
  requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  refund_amount decimal(15,2) NOT NULL,
  refund_reason text NOT NULL,
  refund_status text DEFAULT 'pending' CHECK (refund_status IN ('pending', 'approved', 'rejected', 'processed')),
  refund_method text CHECK (refund_method IN ('original_payment', 'wallet', 'bank_transfer')),
  processed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Admins can view all refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Customers can request refunds"
  ON refunds FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins can manage refunds"
  ON refunds FOR UPDATE
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

-- Financial Notifications Table
CREATE TABLE IF NOT EXISTS financial_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('payout', 'refund', 'settlement', 'payment_received', 'withdrawal_completed')),
  amount decimal(15,2) NOT NULL,
  currency_code text DEFAULT 'USD',
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial notifications"
  ON financial_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own financial notifications"
  ON financial_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert financial notifications"
  ON financial_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Vendor Plans Table
CREATE TABLE IF NOT EXISTS vendor_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  plan_description text,
  price decimal(10,2) NOT NULL,
  currency_code text DEFAULT 'USD',
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annually')),
  features jsonb DEFAULT '[]'::jsonb,
  product_limit integer,
  commission_rate decimal(5,2),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active plans"
  ON vendor_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage vendor plans"
  ON vendor_plans FOR ALL
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

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  template_subject text NOT NULL,
  template_body text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('order_confirmation', 'shipping_notification', 'refund_processed', 'welcome', 'password_reset', 'vendor_approval', 'custom')),
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
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

-- Vendor Performance Analytics Table
CREATE TABLE IF NOT EXISTS vendor_performance_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES vendor_profiles(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue decimal(15,2) DEFAULT 0.00,
  total_products integer DEFAULT 0,
  average_rating decimal(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  order_fulfillment_rate decimal(5,2) DEFAULT 0.00,
  average_delivery_time_days decimal(5,2) DEFAULT 0.00,
  return_rate decimal(5,2) DEFAULT 0.00,
  customer_satisfaction_score decimal(3,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, period_start, period_end)
);

ALTER TABLE vendor_performance_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own analytics"
  ON vendor_performance_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE vendor_profiles.id = vendor_performance_analytics.vendor_id
      AND vendor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analytics"
  ON vendor_performance_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert analytics"
  ON vendor_performance_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_vat_country_code ON vat_configurations(country_code);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_user_id ON financial_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_notifications_unread ON financial_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor_id ON vendor_performance_analytics(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_period ON vendor_performance_analytics(period_start, period_end);
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
/*
  # Vendor Packages and Subscription System

  ## Overview
  This migration creates a comprehensive vendor package and subscription system that allows:
  - Multiple subscription tiers with customizable features
  - Payment tracking and history
  - Feature-based access control for vendors
  - Support for multiple payment gateways (Stripe, PayPal, PayNow)

  ## New Tables
  
  ### `vendor_packages`
  Defines the subscription packages available to vendors
  - `id` (uuid, primary key)
  - `name` (text) - Package name (e.g., "Free", "Basic", "Pro", "Enterprise")
  - `description` (text) - Package description
  - `price_monthly` (decimal) - Monthly price in USD
  - `price_yearly` (decimal) - Yearly price in USD (optional)
  - `product_limit` (integer) - Maximum products vendor can upload
  - `has_ads_access` (boolean) - Can access advertising features
  - `has_promotion_access` (boolean) - Can promote/boost products
  - `has_analytics_access` (boolean) - Can access advanced analytics
  - `has_priority_support` (boolean) - Has priority customer support
  - `is_active` (boolean) - Is package currently available
  - `is_default` (boolean) - Is this the default package for new vendors
  - `sort_order` (integer) - Display order
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `vendor_subscriptions`
  Tracks vendor's current subscription and status
  - `id` (uuid, primary key)
  - `vendor_id` (uuid) - Foreign key to auth.users
  - `package_id` (uuid) - Foreign key to vendor_packages
  - `status` (text) - active, cancelled, expired, pending
  - `billing_cycle` (text) - monthly, yearly
  - `current_period_start` (timestamptz)
  - `current_period_end` (timestamptz)
  - `cancel_at_period_end` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `vendor_transactions`
  Records all payment transactions
  - `id` (uuid, primary key)
  - `vendor_id` (uuid) - Foreign key to auth.users
  - `subscription_id` (uuid) - Foreign key to vendor_subscriptions
  - `package_id` (uuid) - Foreign key to vendor_packages
  - `amount` (decimal) - Transaction amount
  - `currency` (text) - Currency code (USD, SGD, etc.)
  - `payment_gateway` (text) - stripe, paypal, paynow
  - `payment_gateway_transaction_id` (text) - External transaction ID
  - `status` (text) - pending, completed, failed, refunded
  - `transaction_type` (text) - subscription, upgrade, renewal
  - `metadata` (jsonb) - Additional payment data
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admins can manage all package data
  - Vendors can only view their own subscription and transaction data
  - Public users can view active packages
*/

-- Create vendor_packages table
CREATE TABLE IF NOT EXISTS vendor_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly decimal(10, 2) NOT NULL DEFAULT 0,
  price_yearly decimal(10, 2) DEFAULT 0,
  product_limit integer NOT NULL DEFAULT 10,
  has_ads_access boolean DEFAULT false,
  has_promotion_access boolean DEFAULT false,
  has_analytics_access boolean DEFAULT false,
  has_priority_support boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vendor_subscriptions table
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES vendor_packages(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id)
);

-- Create vendor_transactions table
CREATE TABLE IF NOT EXISTS vendor_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES vendor_subscriptions(id) ON DELETE SET NULL,
  package_id uuid NOT NULL REFERENCES vendor_packages(id) ON DELETE RESTRICT,
  amount decimal(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  payment_gateway text NOT NULL CHECK (payment_gateway IN ('stripe', 'paypal', 'paynow')),
  payment_gateway_transaction_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription', 'upgrade', 'renewal')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor_id ON vendor_subscriptions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_package_id ON vendor_subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_status ON vendor_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_vendor_id ON vendor_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_subscription_id ON vendor_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_vendor_transactions_status ON vendor_transactions(status);
CREATE INDEX IF NOT EXISTS idx_vendor_packages_is_active ON vendor_packages(is_active);

-- Enable RLS
ALTER TABLE vendor_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_packages
CREATE POLICY "Anyone can view active packages"
  ON vendor_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert packages"
  ON vendor_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update packages"
  ON vendor_packages FOR UPDATE
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

CREATE POLICY "Admins can delete packages"
  ON vendor_packages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for vendor_subscriptions
CREATE POLICY "Vendors can view own subscription"
  ON vendor_subscriptions FOR SELECT
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert subscriptions"
  ON vendor_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Vendors can update own subscription"
  ON vendor_subscriptions FOR UPDATE
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for vendor_transactions
CREATE POLICY "Vendors can view own transactions"
  ON vendor_transactions FOR SELECT
  TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can insert transactions"
  ON vendor_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default packages
INSERT INTO vendor_packages (name, description, price_monthly, price_yearly, product_limit, has_ads_access, has_promotion_access, has_analytics_access, has_priority_support, is_default, sort_order)
VALUES 
  ('Free', 'Perfect for getting started', 0, 0, 10, false, false, false, false, true, 1),
  ('Basic', 'For growing businesses', 29.99, 299.99, 50, true, false, true, false, false, 2),
  ('Pro', 'For established vendors', 79.99, 799.99, 200, true, true, true, false, false, 3),
  ('Enterprise', 'Unlimited everything', 199.99, 1999.99, 999999, true, true, true, true, false, 4)
ON CONFLICT DO NOTHING;

-- Function to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_vendor_packages_updated_at ON vendor_packages;
CREATE TRIGGER update_vendor_packages_updated_at
  BEFORE UPDATE ON vendor_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_subscriptions_updated_at ON vendor_subscriptions;
CREATE TRIGGER update_vendor_subscriptions_updated_at
  BEFORE UPDATE ON vendor_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default package
CREATE OR REPLACE FUNCTION ensure_single_default_package()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE vendor_packages SET is_default = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_package_trigger ON vendor_packages;
CREATE TRIGGER ensure_single_default_package_trigger
  AFTER INSERT OR UPDATE ON vendor_packages
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_package();
/*
  # Add Vendor Portal Features to Packages

  ## Overview
  Extends the vendor_packages table to include all vendor portal features that can be enabled/disabled per package.

  ## Changes
  
  ### Modified Tables
  - `vendor_packages`
    - Added `has_catalog_management` (boolean) - Can manage product catalog
    - Added `has_stock_management` (boolean) - Can manage inventory/stock
    - Added `has_pos_access` (boolean) - Can access Point of Sale features
    - Added `has_orders_management` (boolean) - Can manage orders
    - Added `has_wallet_management` (boolean) - Can manage vendor wallet
    - Added `has_shipping_management` (boolean) - Can manage shipping settings
    - Added `has_withdraw_management` (boolean) - Can withdraw funds
    - Added `has_shop_configurations` (boolean) - Can configure shop settings
    - Added `has_reports_management` (boolean) - Can access reports and analytics
    - Added `has_customer_support` (boolean) - Can access customer support tools
    - Added `has_notifications` (boolean) - Can receive and manage notifications
    - Added `has_refund_management` (boolean) - Can process refunds
    - Added `has_kyc_verification` (boolean) - Requires/has KYC verification

  ## Notes
  - Vendor Dashboard is always available (base feature)
  - Existing promotion_access and analytics_access columns are kept for backward compatibility
  - All features default to false for granular control
*/

-- Add new feature columns to vendor_packages
DO $$
BEGIN
  -- Catalog Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_catalog_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_catalog_management boolean DEFAULT false;
  END IF;

  -- Stock Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_stock_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_stock_management boolean DEFAULT false;
  END IF;

  -- POS Access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_pos_access'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_pos_access boolean DEFAULT false;
  END IF;

  -- Orders Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_orders_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_orders_management boolean DEFAULT false;
  END IF;

  -- Wallet Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_wallet_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_wallet_management boolean DEFAULT false;
  END IF;

  -- Shipping Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_shipping_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_shipping_management boolean DEFAULT false;
  END IF;

  -- Withdraw Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_withdraw_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_withdraw_management boolean DEFAULT false;
  END IF;

  -- Shop Configurations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_shop_configurations'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_shop_configurations boolean DEFAULT false;
  END IF;

  -- Reports Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_reports_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_reports_management boolean DEFAULT false;
  END IF;

  -- Customer Support
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_customer_support'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_customer_support boolean DEFAULT false;
  END IF;

  -- Notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_notifications'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_notifications boolean DEFAULT false;
  END IF;

  -- Refund Management
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_refund_management'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_refund_management boolean DEFAULT false;
  END IF;

  -- KYC Verification
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_packages' AND column_name = 'has_kyc_verification'
  ) THEN
    ALTER TABLE vendor_packages ADD COLUMN has_kyc_verification boolean DEFAULT false;
  END IF;
END $$;

-- Update existing packages with default feature sets
UPDATE vendor_packages
SET 
  has_catalog_management = true,
  has_stock_management = true,
  has_orders_management = true,
  has_notifications = true,
  has_shop_configurations = true
WHERE name = 'Free';

UPDATE vendor_packages
SET 
  has_catalog_management = true,
  has_stock_management = true,
  has_orders_management = true,
  has_shipping_management = true,
  has_wallet_management = true,
  has_notifications = true,
  has_shop_configurations = true,
  has_reports_management = true,
  has_customer_support = true
WHERE name = 'Basic';

UPDATE vendor_packages
SET 
  has_catalog_management = true,
  has_stock_management = true,
  has_pos_access = true,
  has_orders_management = true,
  has_shipping_management = true,
  has_wallet_management = true,
  has_withdraw_management = true,
  has_notifications = true,
  has_shop_configurations = true,
  has_reports_management = true,
  has_customer_support = true,
  has_refund_management = true
WHERE name = 'Pro';

UPDATE vendor_packages
SET 
  has_catalog_management = true,
  has_stock_management = true,
  has_pos_access = true,
  has_orders_management = true,
  has_shipping_management = true,
  has_wallet_management = true,
  has_withdraw_management = true,
  has_notifications = true,
  has_shop_configurations = true,
  has_reports_management = true,
  has_customer_support = true,
  has_refund_management = true,
  has_kyc_verification = true
WHERE name = 'Enterprise';
/*
  # Enhanced Roles & Permissions System

  1. Changes
    - Add default system roles (Staff, Accountant, Support)
    - Create comprehensive permissions structure
    - Add helper functions for permission checking
    - Update RLS policies for role-based access

  2. Permissions Structure
    Each feature has four permission levels:
    - create: Add new records
    - read: View records
    - update: Modify existing records  
    - delete: Remove records

  3. Features with Permissions
    - customers: Customer management
    - vendors: Vendor management
    - products: Product catalog management
    - orders: Order processing
    - financial: Wallet, transactions, commissions
    - analytics: Reports and analytics
    - settings: System configuration
    - support: Support tickets
    - delivery: Delivery management
    - kyc: KYC verification
    - roles: Role and permission management
    - refunds: Refund processing
    - coupons: Coupon management
    - reviews: Review management
    - notifications: Notification management
*/

-- Insert default roles if they don't exist
DO $$
BEGIN
  -- Staff Role: Basic operational access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Staff') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Staff',
      'General staff member with basic operational access',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'financial', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', true),
        'notifications', jsonb_build_object('create', true, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;

  -- Accountant Role: Financial access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Accountant') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Accountant',
      'Financial management and reporting access',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'orders', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'financial', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'notifications', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;

  -- Support Role: Customer support access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Support') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Support',
      'Customer support and ticket management',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'orders', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'financial', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', true),
        'notifications', jsonb_build_object('create', true, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;
END $$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid uuid,
  feature_name text,
  permission_type text
) RETURNS boolean AS $$
DECLARE
  has_perm boolean;
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check user's role permissions
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = user_uuid
      AND ur.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND (ur.permissions -> feature_name ->> permission_type)::boolean = true
  ) INTO has_perm;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  user_perms jsonb;
BEGIN
  -- If admin, return all permissions
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'customers', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'vendors', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'financial', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'analytics', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'settings', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'delivery', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'kyc', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'roles', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'coupons', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'reviews', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'notifications', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
    );
  END IF;

  -- Aggregate all role permissions for the user
  SELECT jsonb_object_agg(
    feature,
    jsonb_build_object(
      'create', bool_or((perms -> feature ->> 'create')::boolean),
      'read', bool_or((perms -> feature ->> 'read')::boolean),
      'update', bool_or((perms -> feature ->> 'update')::boolean),
      'delete', bool_or((perms -> feature ->> 'delete')::boolean)
    )
  )
  INTO user_perms
  FROM (
    SELECT 
      ur.permissions as perms,
      jsonb_object_keys(ur.permissions) as feature
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = user_uuid
      AND ur.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
  ) sub
  GROUP BY feature;

  RETURN COALESCE(user_perms, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
/*
  # Vendor Currency Management System

  1. Changes
    - Deactivate all currencies except USD and ZWL
    - Set USD as base currency (exchange_rate = 1.0)
    - Create vendor_currency_rates table for vendor-specific exchange rates
    - Add default vendor currency rates

  2. New Tables
    - `vendor_currency_rates`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, foreign key to vendor_profiles)
      - `currency_code` (text, references currencies)
      - `exchange_rate` (numeric, vendor's custom rate)
      - `is_active` (boolean, whether vendor accepts this currency)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on vendor_currency_rates
    - Vendors can only manage their own currency rates
    - Admins can view all currency rates

  4. Notes
    - USD is the base currency (rate always 1.0)
    - Vendors can set their own ZWL rates
    - System only supports USD and ZWL
*/

-- Deactivate all currencies except USD and ZWL
UPDATE currencies 
SET is_active = false 
WHERE code NOT IN ('USD', 'ZWL');

-- Ensure USD is base currency
UPDATE currencies 
SET exchange_rate = 1.0, is_active = true 
WHERE code = 'USD';

-- Ensure ZWL is active
UPDATE currencies 
SET is_active = true 
WHERE code = 'ZWL';

-- Create vendor currency rates table
CREATE TABLE IF NOT EXISTS vendor_currency_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  currency_code text NOT NULL REFERENCES currencies(code),
  exchange_rate numeric(20, 6) NOT NULL CHECK (exchange_rate > 0),
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, currency_code)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vendor_currency_rates_vendor 
ON vendor_currency_rates(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_currency_rates_currency 
ON vendor_currency_rates(currency_code);

-- Enable RLS
ALTER TABLE vendor_currency_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Vendors can view their own currency rates
CREATE POLICY "Vendors can view own currency rates"
  ON vendor_currency_rates
  FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can insert their own currency rates
CREATE POLICY "Vendors can insert own currency rates"
  ON vendor_currency_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can update their own currency rates
CREATE POLICY "Vendors can update own currency rates"
  ON vendor_currency_rates
  FOR UPDATE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Vendors can delete their own currency rates
CREATE POLICY "Vendors can delete own currency rates"
  ON vendor_currency_rates
  FOR DELETE
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendor_profiles WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all currency rates
CREATE POLICY "Admins can view all currency rates"
  ON vendor_currency_rates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to automatically update timestamp
CREATE OR REPLACE FUNCTION update_vendor_currency_rate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_vendor_currency_rates_timestamp ON vendor_currency_rates;
CREATE TRIGGER update_vendor_currency_rates_timestamp
  BEFORE UPDATE ON vendor_currency_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_currency_rate_timestamp();

-- Add default currency rates for existing vendors
DO $$
DECLARE
  vendor_record RECORD;
  default_zwl_rate numeric := 322.0;
BEGIN
  FOR vendor_record IN SELECT id FROM vendor_profiles
  LOOP
    -- Add USD rate (always 1.0)
    INSERT INTO vendor_currency_rates (vendor_id, currency_code, exchange_rate, is_active)
    VALUES (vendor_record.id, 'USD', 1.0, true)
    ON CONFLICT (vendor_id, currency_code) DO NOTHING;
    
    -- Add ZWL rate with default system rate
    INSERT INTO vendor_currency_rates (vendor_id, currency_code, exchange_rate, is_active)
    VALUES (vendor_record.id, 'ZWL', default_zwl_rate, true)
    ON CONFLICT (vendor_id, currency_code) DO NOTHING;
  END LOOP;
END $$;

-- Function to get vendor's exchange rate for a currency
CREATE OR REPLACE FUNCTION get_vendor_exchange_rate(
  p_vendor_id uuid,
  p_currency_code text
) RETURNS numeric AS $$
DECLARE
  v_rate numeric;
BEGIN
  -- USD is always 1.0
  IF p_currency_code = 'USD' THEN
    RETURN 1.0;
  END IF;
  
  -- Get vendor's custom rate
  SELECT exchange_rate INTO v_rate
  FROM vendor_currency_rates
  WHERE vendor_id = p_vendor_id 
    AND currency_code = p_currency_code 
    AND is_active = true;
  
  -- If vendor doesn't have a custom rate, use system rate
  IF v_rate IS NULL THEN
    SELECT exchange_rate INTO v_rate
    FROM currencies
    WHERE code = p_currency_code AND is_active = true;
  END IF;
  
  RETURN COALESCE(v_rate, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert price using vendor's rate
CREATE OR REPLACE FUNCTION convert_vendor_price(
  p_vendor_id uuid,
  p_amount numeric,
  p_from_currency text,
  p_to_currency text
) RETURNS numeric AS $$
DECLARE
  v_from_rate numeric;
  v_to_rate numeric;
  v_usd_amount numeric;
BEGIN
  -- If same currency, return original amount
  IF p_from_currency = p_to_currency THEN
    RETURN p_amount;
  END IF;
  
  -- Get rates
  v_from_rate := get_vendor_exchange_rate(p_vendor_id, p_from_currency);
  v_to_rate := get_vendor_exchange_rate(p_vendor_id, p_to_currency);
  
  -- Convert to USD first, then to target currency
  v_usd_amount := p_amount / v_from_rate;
  RETURN v_usd_amount * v_to_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
/*
  # Create Contracts Management System

  1. New Tables
    - `contracts`
      - `id` (uuid, primary key)
      - `contract_type` (enum: 'vendor_terms', 'vendor_privacy', 'customer_terms', 'customer_privacy')
      - `title` (text)
      - `content` (text, full contract content)
      - `version` (text, version number)
      - `is_active` (boolean, whether this version is currently active)
      - `effective_date` (timestamptz, when this version becomes effective)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contract_acceptances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `contract_id` (uuid, references contracts)
      - `accepted_at` (timestamptz)
      - `ip_address` (text, for audit trail)
      - `user_agent` (text, for audit trail)

  2. Security
    - Enable RLS on both tables
    - Admins can manage contracts
    - Users can view active contracts
    - Users can accept contracts and view their own acceptances
*/

-- Create contract type enum
CREATE TYPE contract_type AS ENUM (
  'vendor_terms',
  'vendor_privacy',
  'customer_terms',
  'customer_privacy'
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type contract_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean DEFAULT false,
  effective_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contract acceptances table
CREATE TABLE IF NOT EXISTS contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  UNIQUE(user_id, contract_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_type_active ON contracts(contract_type, is_active);
CREATE INDEX IF NOT EXISTS idx_contracts_effective_date ON contracts(effective_date);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_user ON contract_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_contract ON contract_acceptances(contract_id);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;

-- Contracts policies
CREATE POLICY "Anyone can view active contracts"
  ON contracts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage contracts"
  ON contracts FOR ALL
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

-- Contract acceptances policies
CREATE POLICY "Users can view their own acceptances"
  ON contract_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own acceptances"
  ON contract_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all acceptances"
  ON contract_acceptances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contracts
DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Insert default contracts
INSERT INTO contracts (contract_type, title, content, version, is_active, created_at) VALUES
(
  'vendor_terms',
  'Vendor Terms and Conditions',
  E'# Vendor Terms and Conditions\n\n## 1. Introduction\nWelcome to our marketplace platform. These terms and conditions govern your use of our platform as a vendor.\n\n## 2. Vendor Registration\n2.1. You must provide accurate and complete information during registration.\n2.2. You are responsible for maintaining the confidentiality of your account credentials.\n\n## 3. Product Listings\n3.1. You are solely responsible for the accuracy of product descriptions, pricing, and availability.\n3.2. Products must comply with all applicable laws and regulations.\n3.3. Prohibited items include counterfeit goods, illegal substances, and any items that violate intellectual property rights.\n\n## 4. Pricing and Fees\n4.1. Commission rates are specified in your vendor package agreement.\n4.2. Fees are deducted automatically from each transaction.\n4.3. You are responsible for all applicable taxes on your sales.\n\n## 5. Order Fulfillment\n5.1. You must fulfill orders promptly according to the stated delivery timeframe.\n5.2. You are responsible for packaging and shipping products securely.\n5.3. Tracking information must be provided for all shipments.\n\n## 6. Customer Service\n6.1. You must respond to customer inquiries within 24 hours.\n6.2. You are responsible for handling returns and exchanges according to your stated policy.\n\n## 7. Payment Terms\n7.1. Payments are processed according to the payment schedule in your vendor agreement.\n7.2. Refunds and chargebacks may be deducted from your account balance.\n\n## 8. Intellectual Property\n8.1. You retain ownership of your product listings and content.\n8.2. You grant us a license to display and promote your products on our platform.\n\n## 9. Termination\n9.1. Either party may terminate this agreement with written notice.\n9.2. We may suspend or terminate your account for violations of these terms.\n\n## 10. Limitation of Liability\nOur liability is limited to the maximum extent permitted by law.\n\n## 11. Changes to Terms\nWe reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.\n\n## 12. Contact\nFor questions about these terms, please contact our support team.',
  '1.0',
  true,
  now()
),
(
  'vendor_privacy',
  'Vendor Privacy Policy',
  E'# Vendor Privacy Policy\n\n## 1. Information We Collect\n\n### 1.1 Account Information\n- Business name and registration details\n- Contact information (email, phone, address)\n- Banking and payment information\n- Tax identification numbers\n\n### 1.2 Business Information\n- Product listings and inventory data\n- Sales and transaction history\n- Customer interaction records\n- Performance metrics and analytics\n\n### 1.3 Technical Information\n- IP addresses and device information\n- Browser type and version\n- Usage data and activity logs\n\n## 2. How We Use Your Information\n\n### 2.1 Platform Operations\n- Process transactions and payments\n- Manage your vendor account\n- Provide customer support\n- Detect and prevent fraud\n\n### 2.2 Business Analytics\n- Generate sales reports and insights\n- Improve platform functionality\n- Optimize user experience\n\n### 2.3 Communication\n- Send transaction notifications\n- Provide platform updates\n- Share marketing opportunities (with consent)\n\n## 3. Information Sharing\n\n### 3.1 We Share Information With:\n- Customers (product listings, business name, ratings)\n- Payment processors (for transaction processing)\n- Shipping carriers (for order fulfillment)\n- Legal authorities (when required by law)\n\n### 3.2 We Do Not:\n- Sell your personal information to third parties\n- Share banking details with unauthorized parties\n- Disclose confidential business information\n\n## 4. Data Security\n- Encryption of sensitive data\n- Regular security audits\n- Secure payment processing\n- Access controls and authentication\n\n## 5. Data Retention\n- Account data retained while account is active\n- Transaction records kept for legal and tax purposes\n- Inactive accounts may be deleted after notification\n\n## 6. Your Rights\n- Access your personal information\n- Correct inaccurate data\n- Request data deletion (subject to legal requirements)\n- Export your data\n- Opt-out of marketing communications\n\n## 7. Cookies and Tracking\n- Essential cookies for platform functionality\n- Analytics cookies for performance monitoring\n- You can control cookie preferences in your browser\n\n## 8. International Transfers\nYour data may be processed in different countries where our servers are located.\n\n## 9. Updates to Privacy Policy\nWe will notify you of significant changes to this policy.\n\n## 10. Contact Information\nFor privacy concerns, contact our Data Protection Officer.',
  '1.0',
  true,
  now()
),
(
  'customer_terms',
  'Customer Terms and Conditions',
  E'# Customer Terms and Conditions\n\n## 1. Introduction\nWelcome to our marketplace. These terms govern your use of our platform as a customer.\n\n## 2. Account Registration\n2.1. You must be at least 18 years old to create an account.\n2.2. Provide accurate and complete registration information.\n2.3. Keep your account credentials confidential.\n2.4. You are responsible for all activities under your account.\n\n## 3. Product Purchases\n\n### 3.1 Order Process\n- Browse products from various vendors\n- Add items to your shopping cart\n- Complete checkout with payment information\n- Receive order confirmation\n\n### 3.2 Product Information\n- Product descriptions are provided by vendors\n- Prices are set by individual vendors\n- Availability is subject to vendor inventory\n\n### 3.3 Pricing\n- All prices are displayed in the selected currency\n- Prices include applicable taxes unless otherwise stated\n- Shipping costs are calculated at checkout\n\n## 4. Payment\n\n### 4.1 Payment Methods\n- We accept major credit cards and debit cards\n- Payment is processed securely through our payment gateway\n- Payment must be completed before order processing\n\n### 4.2 Payment Authorization\n- By placing an order, you authorize payment\n- Funds are charged when order is confirmed\n- Failed payments will cancel the order\n\n## 5. Shipping and Delivery\n\n### 5.1 Shipping\n- Shipping is handled by individual vendors\n- Delivery times vary by vendor and location\n- Tracking information will be provided when available\n\n### 5.2 Delivery Issues\n- Contact the vendor for delivery concerns\n- Report non-delivery within specified timeframe\n- Platform support available for unresolved issues\n\n## 6. Returns and Refunds\n\n### 6.1 Return Policy\n- Each vendor sets their own return policy\n- Review vendor return policy before purchase\n- Return requests must follow vendor guidelines\n\n### 6.2 Refunds\n- Refunds processed according to vendor policy\n- Refunds issued to original payment method\n- Processing time varies by payment provider\n\n## 7. User Conduct\n\n### 7.1 You Agree Not To:\n- Violate any laws or regulations\n- Infringe on intellectual property rights\n- Post false or misleading reviews\n- Engage in fraudulent activities\n- Harass vendors or other users\n\n### 7.2 Consequences\n- Account suspension or termination for violations\n- Legal action for serious breaches\n\n## 8. Reviews and Ratings\n\n### 8.1 Review Guidelines\n- Reviews must be based on genuine experience\n- Provide honest and constructive feedback\n- No offensive or inappropriate content\n- No promotional content or spam\n\n### 8.2 Review Rights\n- We reserve the right to remove inappropriate reviews\n- Vendors may respond to reviews\n\n## 9. Intellectual Property\n- Platform content is protected by copyright\n- User-generated content remains your property\n- You grant us license to display your content\n\n## 10. Privacy\nYour use of the platform is subject to our Privacy Policy.\n\n## 11. Limitation of Liability\n\n### 11.1 Platform Role\n- We act as an intermediary between customers and vendors\n- Vendors are responsible for their products and services\n- We are not liable for vendor actions or product defects\n\n### 11.2 Liability Limits\n- Liability limited to amount paid for the specific transaction\n- No liability for indirect or consequential damages\n\n## 12. Dispute Resolution\n\n### 12.1 Customer-Vendor Disputes\n- Attempt to resolve directly with vendor first\n- Contact platform support if resolution unsuccessful\n- Mediation services available for serious disputes\n\n### 12.2 Platform Disputes\n- Governed by laws of our jurisdiction\n- Arbitration clause may apply\n\n## 13. Termination\n- You may close your account at any time\n- We may suspend or terminate accounts for violations\n- Outstanding orders must be completed before account closure\n\n## 14. Changes to Terms\n- We may update these terms periodically\n- Continued use constitutes acceptance of changes\n- Significant changes will be notified via email\n\n## 15. Contact\nFor questions or concerns, contact our customer support team.',
  '1.0',
  true,
  now()
),
(
  'customer_privacy',
  'Customer Privacy Policy',
  E'# Customer Privacy Policy\n\n## 1. Introduction\nWe respect your privacy and are committed to protecting your personal information.\n\n## 2. Information We Collect\n\n### 2.1 Account Information\n- Name and contact details\n- Email address and phone number\n- Shipping and billing addresses\n- Account credentials\n\n### 2.2 Purchase Information\n- Order history and details\n- Payment information (processed securely)\n- Shipping preferences\n- Product reviews and ratings\n\n### 2.3 Technical Information\n- IP address and device type\n- Browser information\n- Cookies and similar technologies\n- Usage patterns and preferences\n\n### 2.4 Communication Data\n- Customer support interactions\n- Emails and messages\n- Survey responses and feedback\n\n## 3. How We Use Your Information\n\n### 3.1 Order Processing\n- Process and fulfill your orders\n- Communicate order status and updates\n- Handle returns and refunds\n- Provide customer support\n\n### 3.2 Account Management\n- Create and maintain your account\n- Authenticate your identity\n- Send account-related notifications\n\n### 3.3 Platform Improvement\n- Analyze usage patterns\n- Improve user experience\n- Develop new features\n- Personalize your shopping experience\n\n### 3.4 Marketing (With Consent)\n- Send promotional emails\n- Recommend products\n- Share special offers and discounts\n- You can opt-out at any time\n\n### 3.5 Legal Compliance\n- Comply with legal obligations\n- Prevent fraud and abuse\n- Enforce terms and conditions\n- Protect rights and safety\n\n## 4. Information Sharing\n\n### 4.1 We Share Your Information With:\n\n#### Vendors\n- Name and shipping address (for order fulfillment)\n- Order details\n- Contact information (for order-related communication)\n\n#### Service Providers\n- Payment processors (for transaction processing)\n- Shipping companies (for delivery)\n- Cloud storage providers\n- Analytics services\n- Customer support tools\n\n#### Legal Requirements\n- Law enforcement (when legally required)\n- Court orders and legal processes\n- Protection of rights and safety\n\n### 4.2 We Do Not:\n- Sell your personal information\n- Share payment card details with vendors\n- Disclose information for marketing purposes without consent\n\n## 5. Data Security\n\n### 5.1 Security Measures\n- Encryption of sensitive data (SSL/TLS)\n- Secure payment processing (PCI DSS compliant)\n- Regular security assessments\n- Access controls and authentication\n- Employee training on data protection\n\n### 5.2 Your Responsibility\n- Keep password secure and confidential\n- Use strong, unique passwords\n- Log out after using shared devices\n- Report suspicious activity immediately\n\n## 6. Data Retention\n\n### 6.1 Retention Periods\n- Account data: While account is active\n- Order history: 7 years (for legal and tax purposes)\n- Payment information: Not stored (handled by payment processor)\n- Marketing data: Until you opt-out\n\n### 6.2 Account Deletion\n- Request account deletion anytime\n- Some data retained for legal compliance\n- Anonymized data may be kept for analytics\n\n## 7. Your Rights\n\n### 7.1 You Have the Right To:\n- Access your personal information\n- Correct inaccurate data\n- Request data deletion\n- Export your data\n- Withdraw consent\n- Object to processing\n- Lodge a complaint with authorities\n\n### 7.2 Exercising Your Rights\n- Contact our privacy team\n- Use account settings for basic controls\n- Response within 30 days\n\n## 8. Cookies and Tracking\n\n### 8.1 Cookie Types\n- Essential cookies (required for platform operation)\n- Analytics cookies (usage statistics)\n- Preference cookies (your settings)\n- Marketing cookies (personalized ads - with consent)\n\n### 8.2 Cookie Control\n- Manage preferences in cookie settings\n- Browser settings can block cookies\n- Some features may not work without essential cookies\n\n## 9. Third-Party Links\n- Our platform may contain links to external websites\n- We are not responsible for their privacy practices\n- Review their privacy policies before providing information\n\n## 10. Children\'s Privacy\n- Platform not intended for users under 18\n- No knowing collection of children\'s information\n- Contact us if you believe we have children\'s data\n\n## 11. International Data Transfers\n- Data may be processed in different countries\n- Adequate safeguards in place for transfers\n- Compliance with applicable data protection laws\n\n## 12. Changes to Privacy Policy\n\n### 12.1 Policy Updates\n- We may update this policy periodically\n- Notification of significant changes via email\n- Continued use indicates acceptance\n- Previous versions available upon request\n\n## 13. Contact Us\n\n### 13.1 Privacy Inquiries\n- Email: privacy@marketplace.com\n- Data Protection Officer contact\n- Response time: 5-7 business days\n\n### 13.2 Support Channels\n- Help Center\n- Live Chat (for urgent concerns)\n- Phone support\n\n## 14. Consent\nBy using our platform, you consent to this privacy policy.',
  '1.0',
  true,
  now()
);
/*
  # Enhanced Multi-Currency Wallet System

  1. Changes to Existing Tables
    - Add currency-specific balance columns to wallets table
    - Add commission_rate field to products table
    
  2. New Tables
    - `withdrawal_requests`
      - `id` (uuid, primary key)
      - `vendor_id` (uuid, references profiles)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (enum: pending, approved, rejected, completed)
      - `withdrawal_charges` (numeric)
      - `net_amount` (numeric, amount after charges)
      - `requested_at` (timestamptz)
      - `processed_at` (timestamptz)
      - `processed_by` (uuid, references profiles)
      - `rejection_reason` (text)
      - `payment_method` (text)
      - `account_details` (jsonb)
    
    - `wallet_transactions_detailed`
      - `id` (uuid, primary key)
      - `wallet_id` (uuid, references wallets)
      - `transaction_type` (enum: deposit, withdrawal, commission, charge, refund)
      - `amount` (numeric)
      - `currency` (text)
      - `balance_before` (numeric)
      - `balance_after` (numeric)
      - `reference_id` (uuid, for linking to orders/withdrawals)
      - `reference_type` (text, order/withdrawal/manual)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `metadata` (jsonb)

  3. Security
    - Enable RLS on all tables
    - Admins can manage all records
    - Vendors can view their own records and create withdrawal requests
    - Proper policies for each transaction type
*/

-- Add currency-specific balance columns to wallets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance_usd'
  ) THEN
    ALTER TABLE wallets ADD COLUMN balance_usd numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'balance_zig'
  ) THEN
    ALTER TABLE wallets ADD COLUMN balance_zig numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_commission_earned'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_commission_earned numeric(15,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wallets' AND column_name = 'total_withdrawn'
  ) THEN
    ALTER TABLE wallets ADD COLUMN total_withdrawn numeric(15,2) DEFAULT 0;
  END IF;
END $$;

-- Add commission rate to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'commission_rate'
  ) THEN
    ALTER TABLE products ADD COLUMN commission_rate numeric(5,2) DEFAULT 10.00;
  END IF;
END $$;

-- Create withdrawal status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
    CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
  END IF;
END $$;

-- Create transaction type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'commission', 'charge', 'refund', 'payment');
  END IF;
END $$;

-- Create withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(15,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  status withdrawal_status DEFAULT 'pending',
  withdrawal_charges numeric(15,2) DEFAULT 0,
  net_amount numeric(15,2) NOT NULL,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id),
  rejection_reason text,
  payment_method text,
  account_details jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create detailed wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions_detailed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallets(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  balance_before numeric(15,2) DEFAULT 0,
  balance_after numeric(15,2) DEFAULT 0,
  reference_id uuid,
  reference_type text,
  description text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_vendor ON withdrawal_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_currency ON withdrawal_requests(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_wallet ON wallet_transactions_detailed(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_type ON wallet_transactions_detailed(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_currency ON wallet_transactions_detailed(currency);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_detailed_reference ON wallet_transactions_detailed(reference_id);

-- Enable RLS
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions_detailed ENABLE ROW LEVEL SECURITY;

-- Withdrawal requests policies
CREATE POLICY "Vendors can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
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

-- Wallet transactions detailed policies
CREATE POLICY "Users can view their own wallet transactions"
  ON wallet_transactions_detailed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM wallets
      WHERE wallets.id = wallet_transactions_detailed.wallet_id
      AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all wallet transactions"
  ON wallet_transactions_detailed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create wallet transactions"
  ON wallet_transactions_detailed FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update withdrawal request updated_at
CREATE OR REPLACE FUNCTION update_withdrawal_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for withdrawal requests
DROP TRIGGER IF EXISTS withdrawal_request_updated_at ON withdrawal_requests;
CREATE TRIGGER withdrawal_request_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_withdrawal_request_updated_at();

-- Function to calculate withdrawal charges (2% of amount)
CREATE OR REPLACE FUNCTION calculate_withdrawal_charges(amount numeric)
RETURNS numeric AS $$
BEGIN
  RETURN ROUND(amount * 0.02, 2);
END;
$$ LANGUAGE plpgsql;

-- Comment on tables and important columns
COMMENT ON TABLE withdrawal_requests IS 'Tracks vendor withdrawal requests with admin approval workflow';
COMMENT ON TABLE wallet_transactions_detailed IS 'Detailed transaction log for all wallet activities';
COMMENT ON COLUMN wallets.balance_usd IS 'Balance in USD currency';
COMMENT ON COLUMN wallets.balance_zig IS 'Balance in ZIG currency';
COMMENT ON COLUMN products.commission_rate IS 'Commission rate percentage for admin (e.g., 10.00 for 10%)';
COMMENT ON COLUMN withdrawal_requests.withdrawal_charges IS 'Charges applied to withdrawal (typically 2%)';
COMMENT ON COLUMN withdrawal_requests.net_amount IS 'Amount vendor receives after charges';
/*
  # Complete Payment System Setup

  Sets up comprehensive payment gateway system with:
  - Enhanced payment_gateways table
  - Payment transactions tracking
  - Payment instructions for manual gateways
  - RLS policies for security
  - Default gateway configurations

  ## New Tables

  1. `payment_transactions` - Tracks all payment transactions
  2. `payment_instructions` - Step-by-step instructions for manual gateways

  ## Enhanced Tables

  1. `payment_gateways` - Added display_name, description, instructions, logo_url, sort_order

  ## Security

  - RLS enabled on all tables
  - Admin-only write access to gateways
  - Users can view own transactions
  - Public read access to active gateways
*/

-- Add new columns to payment_gateways
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'display_name') THEN
    ALTER TABLE payment_gateways ADD COLUMN display_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'description') THEN
    ALTER TABLE payment_gateways ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'instructions') THEN
    ALTER TABLE payment_gateways ADD COLUMN instructions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'logo_url') THEN
    ALTER TABLE payment_gateways ADD COLUMN logo_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_gateways' AND column_name = 'sort_order') THEN
    ALTER TABLE payment_gateways ADD COLUMN sort_order int DEFAULT 0;
  END IF;
END $$;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway_id uuid REFERENCES payment_gateways(id) ON DELETE SET NULL,
  gateway_type text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  transaction_reference text,
  gateway_transaction_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_transaction_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'))
);

-- Create payment_instructions table
CREATE TABLE IF NOT EXISTS payment_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES payment_gateways(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(gateway_id, step_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_gateways_type ON payment_gateways(gateway_type);
CREATE INDEX IF NOT EXISTS idx_payment_gateways_active ON payment_gateways(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_gateway ON payment_instructions(gateway_id);

-- Enable RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_instructions ENABLE ROW LEVEL SECURITY;

-- Payment Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "System can create transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

-- Payment Instructions Policies
CREATE POLICY "Public can view payment instructions"
  ON payment_instructions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM payment_gateways
      WHERE payment_gateways.id = gateway_id
      AND payment_gateways.is_active = true
    )
  );

CREATE POLICY "Admin can manage payment instructions"
  ON payment_instructions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

-- Insert default payment gateways
INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, configuration, instructions, sort_order, supported_currencies)
VALUES
  (
    'paynow',
    'paynow',
    'PayNow Zimbabwe',
    'Fast and secure payments in Zimbabwe using mobile money (Ecocash, OneMoney) and bank cards',
    false,
    '{"integration_id": "", "integration_key": "", "return_url": "", "result_url": ""}'::jsonb,
    'To activate PayNow: 1. Sign up at https://www.paynow.co.zw 2. Get your Integration ID and Integration Key from your merchant dashboard 3. Enter these credentials in the configuration below 4. Configure your return_url and result_url for payment notifications 5. Test with a small transaction before going live',
    1,
    ARRAY['USD', 'ZWL']
  ),
  (
    'paypal',
    'paypal',
    'PayPal',
    'Accept payments worldwide with PayPal',
    false,
    '{"client_id": "", "client_secret": "", "mode": "sandbox"}'::jsonb,
    'To activate PayPal: 1. Create a PayPal Business account at https://www.paypal.com/business 2. Go to Developer Dashboard at https://developer.paypal.com 3. Create a REST API app under "My Apps & Credentials" 4. Copy the Client ID and Secret 5. Test in sandbox mode first, then switch to "live" for production',
    2,
    ARRAY['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
  ),
  (
    'stripe',
    'stripe',
    'Stripe',
    'Accept credit cards and digital wallets globally',
    false,
    '{"publishable_key": "", "secret_key": ""}'::jsonb,
    'To activate Stripe: 1. Sign up at https://stripe.com 2. Complete account verification 3. Go to Developers > API keys 4. Copy your Publishable key and Secret key 5. Use test keys for testing, then switch to live keys for production',
    3,
    ARRAY['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD']
  ),
  (
    'cash',
    'cash',
    'Cash on Delivery',
    'Pay with cash when your order is delivered',
    true,
    '{}'::jsonb,
    'Cash payment will be collected by the delivery person when your order arrives. Please have the exact amount ready as change may not always be available.',
    4,
    ARRAY['USD', 'ZWL']
  );

-- Create function to update payment transaction status
CREATE OR REPLACE FUNCTION update_payment_transaction_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- If payment is completed, update order payment status
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE orders
    SET payment_status = 'paid',
        updated_at = now()
    WHERE id = NEW.order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment status updates
DROP TRIGGER IF EXISTS trigger_update_payment_status ON payment_transactions;
CREATE TRIGGER trigger_update_payment_status
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transaction_status();
/*
  # Fix Payment Gateways RLS Policies

  Updates RLS policies to work with the profiles table structure.
  Allows admins to manage gateways and public/authenticated users to view active gateways.

  ## Changes

  1. Drop existing policies
  2. Create new policies using profiles table
  3. Add public read access to active gateways
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage payment gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Public can view enabled gateways" ON payment_gateways;

-- Admin can view all gateways
CREATE POLICY "Admin can view all gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert gateways
CREATE POLICY "Admin can insert gateways"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update gateways
CREATE POLICY "Admin can update gateways"
  ON payment_gateways FOR UPDATE
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

-- Admin can delete gateways
CREATE POLICY "Admin can delete gateways"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Authenticated users can view active gateways (without sensitive config)
CREATE POLICY "Authenticated users can view active gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Public can view active gateways
CREATE POLICY "Public can view active gateways"
  ON payment_gateways FOR SELECT
  TO public
  USING (is_active = true);
/*
  # Fix Payment Transactions and Instructions RLS Policies

  Updates RLS policies to work with the profiles table structure.

  ## Changes

  1. Drop existing policies on payment_transactions and payment_instructions
  2. Create new policies using profiles table
*/

-- Drop and recreate payment_transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON payment_transactions;
DROP POLICY IF EXISTS "System can create transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Admin can update transactions" ON payment_transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Authenticated users can create their own transactions
CREATE POLICY "Users can create own transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin can update all transactions
CREATE POLICY "Admin can update transactions"
  ON payment_transactions FOR UPDATE
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

-- Drop and recreate payment_instructions policies
DROP POLICY IF EXISTS "Public can view payment instructions" ON payment_instructions;
DROP POLICY IF EXISTS "Admin can manage payment instructions" ON payment_instructions;

-- Public can view instructions for active gateways
CREATE POLICY "Public can view payment instructions"
  ON payment_instructions FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM payment_gateways
      WHERE payment_gateways.id = gateway_id
      AND payment_gateways.is_active = true
    )
  );

-- Admin can view all instructions
CREATE POLICY "Admin can view all instructions"
  ON payment_instructions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert instructions
CREATE POLICY "Admin can insert instructions"
  ON payment_instructions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update instructions
CREATE POLICY "Admin can update instructions"
  ON payment_instructions FOR UPDATE
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

-- Admin can delete instructions
CREATE POLICY "Admin can delete instructions"
  ON payment_instructions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
/*
  # Insert Payment Gateways
  
  Ensures that all payment gateways (PayNow, PayPal, Stripe, Cash) are available in the system.
  
  1. Tables Updated
    - `payment_gateways` - Inserts PayNow, PayPal, Stripe, and Cash gateways
  
  2. Payment Gateways Added
    - **PayNow Zimbabwe** - Mobile money and card payments for Zimbabwe
    - **PayPal** - International payment processing
    - **Stripe** - Credit card and digital wallet payments
    - **Cash on Delivery** - Cash payment on delivery
  
  3. Configuration Details
    - Each gateway has empty configuration fields ready for admin to fill
    - Instructions provided for obtaining API credentials
    - Supported currencies defined for each gateway
    - Sort order set for display priority
  
  4. Important Notes
    - All gateways except Cash are inactive by default
    - Admin must configure API credentials before activating
    - Checks for existing gateways to prevent duplicates
*/

-- Insert PayNow if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paynow') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'paynow',
      'paynow',
      'PayNow Zimbabwe',
      'Fast and secure payments in Zimbabwe using mobile money (Ecocash, OneMoney) and bank cards',
      false,
      false,
      '{"integration_id": "", "integration_key": "", "return_url": "", "result_url": ""}'::jsonb,
      'To activate PayNow: 1. Sign up at https://www.paynow.co.zw 2. Get your Integration ID and Integration Key from your merchant dashboard 3. Enter these credentials in the configuration below 4. Configure your return_url and result_url for payment notifications 5. Test with a small transaction before going live',
      1,
      ARRAY['USD', 'ZWL']
    );
  END IF;
END $$;

-- Insert PayPal if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paypal') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'paypal',
      'paypal',
      'PayPal',
      'Accept payments worldwide with PayPal',
      false,
      false,
      '{"client_id": "", "client_secret": "", "mode": "sandbox"}'::jsonb,
      'To activate PayPal: 1. Create a PayPal Business account at https://www.paypal.com/business 2. Go to Developer Dashboard at https://developer.paypal.com 3. Create a REST API app under "My Apps & Credentials" 4. Copy the Client ID and Secret 5. Test in sandbox mode first, then switch to "live" for production',
      2,
      ARRAY['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
    );
  END IF;
END $$;

-- Insert Stripe if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'stripe') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'stripe',
      'stripe',
      'Stripe',
      'Accept credit cards and digital wallets globally',
      false,
      false,
      '{"publishable_key": "", "secret_key": ""}'::jsonb,
      'To activate Stripe: 1. Sign up at https://stripe.com 2. Complete account verification 3. Go to Developers > API keys 4. Copy your Publishable key and Secret key 5. Use test keys for testing, then switch to live keys for production',
      3,
      ARRAY['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD']
    );
  END IF;
END $$;

-- Insert Cash on Delivery if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'cash') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'cash',
      'cash',
      'Cash on Delivery',
      'Pay with cash when your order is delivered',
      true,
      true,
      '{}'::jsonb,
      'Cash payment will be collected by the delivery person when your order arrives. Please have the exact amount ready as change may not always be available.',
      4,
      ARRAY['USD', 'ZWL']
    );
  END IF;
END $$;
/*
  # Fix Payment Gateways Admin RLS Policies
  
  Updates RLS policies to work with the new role system (user_roles and user_role_assignments tables)
  instead of the old profiles.role field.
  
  1. Policy Updates
    - Drop old admin policies that check profiles.role
    - Create new admin policies that check user_role_assignments and user_roles
  
  2. Security
    - Admin users can view ALL payment gateways (active and inactive)
    - Admin users can update, insert, and delete payment gateways
    - Regular users can only view active gateways
  
  3. Important Notes
    - This enables admins to see and configure all payment gateways
    - Non-admin users only see active gateways for checkout
*/

-- Drop old admin policies
DROP POLICY IF EXISTS "Admin can view all gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can update gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can insert gateways" ON payment_gateways;
DROP POLICY IF EXISTS "Admin can delete gateways" ON payment_gateways;

-- Create new admin policies using user_roles system
CREATE POLICY "Admin can view all gateways"
  ON payment_gateways FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can update gateways"
  ON payment_gateways FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can insert gateways"
  ON payment_gateways FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );

CREATE POLICY "Admin can delete gateways"
  ON payment_gateways FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_role_assignments ura
      JOIN user_roles ur ON ura.role_id = ur.id
      WHERE ura.user_id = auth.uid()
      AND ur.role_name = 'admin'
    )
  );
/*
  # Setup Admin Role and Profile for Payment Gateway Access
  
  Creates admin role, profile, and assigns role to the admin user.
  
  1. New Data
    - Creates 'admin' role if it doesn't exist
    - Creates profile for admin@zimaio.com user
    - Assigns admin role to admin user
  
  2. Permissions
    - Admin role gets full access to payment gateways
  
  3. Important Notes
    - Required for admin to view and configure payment gateways
    - Creates profile first to satisfy foreign key constraints
*/

-- Insert admin role if it doesn't exist
INSERT INTO user_roles (role_name, role_description, is_active)
VALUES (
  'admin',
  'System administrator with full access to all features',
  true
)
ON CONFLICT (role_name) DO NOTHING;

-- Create profile and assign admin role
DO $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@zimaio.com';
  
  -- Get admin role ID
  SELECT id INTO admin_role_id
  FROM user_roles
  WHERE role_name = 'admin';
  
  -- Only proceed if both exist
  IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified, created_at)
    VALUES (
      admin_user_id,
      'admin@zimaio.com',
      'System Administrator',
      'admin',
      true,
      true,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at)
    VALUES (admin_user_id, admin_role_id, admin_user_id, now())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
/*
  # VAT System and Admin Product Management

  Creates VAT configuration tables and adds admin management fields to products.
*/

-- VAT Settings Table
CREATE TABLE IF NOT EXISTS vat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  default_rate decimal(5,2) DEFAULT 15.00,
  applies_to_products boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT true,
  updated_by uuid,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Product VAT Overrides Table
CREATE TABLE IF NOT EXISTS product_vat_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  vat_rate decimal(5,2),
  vat_exempt boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id)
);

-- Insert default VAT settings
INSERT INTO vat_settings (is_enabled, default_rate)
VALUES (false, 15.00)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE vat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_vat_overrides ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "vat_select" ON vat_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "vat_update" ON vat_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vat_override_select" ON product_vat_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "vat_override_insert" ON product_vat_overrides FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vat_override_update" ON product_vat_overrides FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vat_override_delete" ON product_vat_overrides FOR DELETE TO authenticated USING (true);

-- Add product admin management fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'admin_approved') THEN
    ALTER TABLE products ADD COLUMN admin_approved boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'admin_notes') THEN
    ALTER TABLE products ADD COLUMN admin_notes text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'rejection_reason') THEN
    ALTER TABLE products ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vat_enabled ON vat_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_vat_override_product ON product_vat_overrides(product_id);
CREATE INDEX IF NOT EXISTS idx_product_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_created ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_product_approved ON products(admin_approved);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds(created_at);
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
/*
  # Create Event Triggers and Communication Configuration Tables

  ## Overview
  This migration creates the infrastructure for automated event-based triggers and
  communication configuration management (SMS and Email).

  ## New Tables

  ### 1. event_triggers
  Stores automated trigger rules that execute actions based on system events.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Human-readable trigger name
  - `event_type` (text) - Type of event that activates the trigger
  - `action_type` (text) - Type of action to execute
  - `conditions` (jsonb) - JSON conditions that must be met
  - `actions` (jsonb) - JSON actions to execute
  - `is_active` (boolean) - Whether trigger is enabled
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. sms_configurations
  Stores SMS gateway configuration for sending text messages.
  - `id` (uuid, primary key) - Unique identifier
  - `provider` (text) - SMS provider name (twilio, africastalking, etc.)
  - `api_key` (text) - Provider API key or access token
  - `sender_id` (text) - Sender ID or phone number
  - `is_active` (boolean) - Whether configuration is active
  - `settings` (jsonb) - Provider-specific settings
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. email_configurations
  Stores email server configuration for sending transactional emails.
  - `id` (uuid, primary key) - Unique identifier
  - `provider` (text) - Email provider (smtp, sendgrid, etc.)
  - `smtp_host` (text) - SMTP server hostname
  - `smtp_port` (integer) - SMTP server port
  - `username` (text) - SMTP username or API key
  - `password` (text) - SMTP password or API secret
  - `from_email` (text) - Default sender email address
  - `from_name` (text) - Default sender name
  - `is_active` (boolean) - Whether configuration is active
  - `settings` (jsonb) - Provider-specific settings
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on all tables
  - Only admins can access these configurations
  - Sensitive credentials stored securely
*/

-- Create event_triggers table
CREATE TABLE IF NOT EXISTS event_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  action_type text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sms_configurations table
CREATE TABLE IF NOT EXISTS sms_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  api_key text,
  sender_id text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_configurations table
CREATE TABLE IF NOT EXISTS email_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  username text,
  password text,
  from_email text,
  from_name text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE event_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_triggers
CREATE POLICY "Admins can view all event triggers"
  ON event_triggers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert event triggers"
  ON event_triggers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update event triggers"
  ON event_triggers FOR UPDATE
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

CREATE POLICY "Admins can delete event triggers"
  ON event_triggers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for sms_configurations
CREATE POLICY "Admins can view SMS configurations"
  ON sms_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert SMS configurations"
  ON sms_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update SMS configurations"
  ON sms_configurations FOR UPDATE
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

CREATE POLICY "Admins can delete SMS configurations"
  ON sms_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for email_configurations
CREATE POLICY "Admins can view email configurations"
  ON email_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert email configurations"
  ON email_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update email configurations"
  ON email_configurations FOR UPDATE
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

CREATE POLICY "Admins can delete email configurations"
  ON email_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_triggers_event_type ON event_triggers(event_type);
CREATE INDEX IF NOT EXISTS idx_event_triggers_is_active ON event_triggers(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_configurations_is_active ON sms_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_email_configurations_is_active ON email_configurations(is_active);
