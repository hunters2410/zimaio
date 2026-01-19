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
