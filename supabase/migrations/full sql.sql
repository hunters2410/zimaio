-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analytics_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_customers integer DEFAULT 0,
  total_vendors integer DEFAULT 0,
  new_customers integer DEFAULT 0,
  new_vendors integer DEFAULT 0,
  new_products integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_daily_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.analytics_order_trends (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  hour integer CHECK (hour >= 0 AND hour <= 23),
  order_count integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_order_trends_pkey PRIMARY KEY (id)
);
CREATE TABLE public.analytics_product_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  date date NOT NULL,
  view_count integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_product_views_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_product_views_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.analytics_vendor_performance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  date date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  total_products_sold integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_vendor_performance_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_vendor_performance_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  changes jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  logo_url text,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  items jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id uuid,
  image_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  participant_ids ARRAY NOT NULL,
  last_message text,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  customer_id uuid,
  vendor_id uuid,
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT chat_conversations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id),
  CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  order_amount numeric NOT NULL,
  commission_rate numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::commission_status,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT commissions_pkey PRIMARY KEY (id),
  CONSTRAINT commissions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT commissions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.contract_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  contract_id uuid,
  accepted_at timestamp with time zone DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT contract_acceptances_pkey PRIMARY KEY (id),
  CONSTRAINT contract_acceptances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT contract_acceptances_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id)
);
CREATE TABLE public.contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  contract_type USER-DEFINED NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0'::text,
  is_active boolean DEFAULT false,
  effective_date timestamp with time zone DEFAULT now(),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contracts_pkey PRIMARY KEY (id),
  CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type USER-DEFINED NOT NULL,
  value numeric NOT NULL,
  vendor_id uuid,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  used_count integer DEFAULT 0,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.currencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  symbol text NOT NULL,
  exchange_rate numeric DEFAULT 1,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT currencies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer_pre_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  company_name text,
  mobile_number text NOT NULL,
  city_area text NOT NULL,
  interests ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT customer_pre_registrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.deliveries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  driver_id uuid,
  customer_id uuid,
  vendor_id uuid,
  delivery_address text NOT NULL,
  customer_phone text NOT NULL,
  delivery_status text DEFAULT 'pending'::text,
  pickup_time timestamp with time zone,
  delivery_time timestamp with time zone,
  delivery_notes text,
  tracking_number text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  logistics_id uuid,
  CONSTRAINT deliveries_pkey PRIMARY KEY (id),
  CONSTRAINT deliveries_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT deliveries_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.delivery_drivers(id),
  CONSTRAINT deliveries_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT deliveries_logistics_id_fkey FOREIGN KEY (logistics_id) REFERENCES public.logistics_profiles(id),
  CONSTRAINT deliveries_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.delivery_drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid,
  driver_name text NOT NULL,
  phone_number text NOT NULL,
  vehicle_type text DEFAULT 'motorcycle'::text,
  vehicle_number text NOT NULL,
  is_available boolean DEFAULT true,
  current_location text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'suspended'::text])),
  logistics_id uuid,
  CONSTRAINT delivery_drivers_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_drivers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT delivery_drivers_logistics_id_fkey FOREIGN KEY (logistics_id) REFERENCES public.logistics_profiles(id)
);
CREATE TABLE public.delivery_tracking_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  delivery_id uuid,
  status text NOT NULL,
  location text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_tracking_history_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_tracking_history_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.deliveries(id)
);
CREATE TABLE public.documentation_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  parent_id uuid,
  icon text,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documentation_sections_pkey PRIMARY KEY (id),
  CONSTRAINT documentation_sections_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.documentation_sections(id)
);
CREATE TABLE public.email_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  username text,
  password text,
  from_email text,
  from_name text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_configurations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  template_subject text NOT NULL,
  template_body text NOT NULL,
  template_type text NOT NULL CHECK (template_type = ANY (ARRAY['order_confirmation'::text, 'shipping_notification'::text, 'refund_processed'::text, 'welcome'::text, 'password_reset'::text, 'vendor_approval'::text, 'custom'::text])),
  variables jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_triggers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL,
  action_type text NOT NULL,
  conditions jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_triggers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.faqs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'General'::text,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT faqs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.financial_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['payout'::text, 'refund'::text, 'settlement'::text, 'payment_received'::text, 'withdrawal_completed'::text])),
  amount numeric NOT NULL,
  currency_code text DEFAULT 'USD'::text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT financial_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT financial_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.fraud_detections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  risk_score numeric NOT NULL,
  risk_factors jsonb,
  status USER-DEFINED DEFAULT 'pending'::fraud_status,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fraud_detections_pkey PRIMARY KEY (id),
  CONSTRAINT fraud_detections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT fraud_detections_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT fraud_detections_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.home_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  button_text text DEFAULT 'Shop Now'::text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT home_slides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kyc_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['passport'::text, 'drivers_license'::text, 'national_id'::text, 'business_registration'::text])),
  document_number text NOT NULL,
  document_url text,
  verification_status text NOT NULL DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  verified_by uuid,
  verified_at timestamp with time zone,
  rejection_reason text,
  submitted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kyc_verifications_pkey PRIMARY KEY (id),
  CONSTRAINT kyc_verifications_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.profiles(id),
  CONSTRAINT kyc_verifications_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.languages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  CONSTRAINT languages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.login_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  role text,
  ip_address text,
  user_agent text,
  status text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT login_logs_pkey PRIMARY KEY (id),
  CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.logistics_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT logistics_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT logistics_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type = ANY (ARRAY['customer'::text, 'vendor'::text])),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id),
  CONSTRAINT messages_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.navigation_menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  label text NOT NULL,
  url text NOT NULL,
  icon text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT navigation_menu_items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  vendor_id uuid,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.order_refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  customer_id uuid,
  vendor_id uuid,
  reason text NOT NULL,
  amount numeric NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::refund_status,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_refunds_pkey PRIMARY KEY (id),
  CONSTRAINT order_refunds_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_refunds_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT order_refunds_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_id uuid,
  vendor_id uuid,
  status USER-DEFINED DEFAULT 'pending'::order_status,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  currency_code text DEFAULT 'USD'::text,
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  payment_method text,
  payment_status USER-DEFINED DEFAULT 'pending'::payment_status,
  tracking_number text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exchange_rate numeric DEFAULT 1.0,
  commission_amount numeric DEFAULT 0,
  vat_amount numeric DEFAULT 0,
  shipping_method_id uuid,
  shipping_total numeric DEFAULT 0,
  tax_total numeric DEFAULT 0,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT orders_shipping_method_id_fkey FOREIGN KEY (shipping_method_id) REFERENCES public.shipping_methods(id)
);
CREATE TABLE public.otp_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  code text NOT NULL,
  purpose USER-DEFINED NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id),
  CONSTRAINT otp_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_gateways (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gateway_name text NOT NULL,
  gateway_type text NOT NULL,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  configuration jsonb DEFAULT '{}'::jsonb,
  supported_currencies ARRAY DEFAULT ARRAY['USD'::text],
  transaction_fee_percentage numeric DEFAULT 0.00,
  transaction_fee_fixed numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  display_name text,
  description text,
  instructions text,
  logo_url text,
  sort_order integer DEFAULT 0,
  CONSTRAINT payment_gateways_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_instructions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gateway_id uuid,
  step_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_instructions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_instructions_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.payment_gateways(id)
);
CREATE TABLE public.payment_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  transaction_id uuid,
  gateway_type character varying NOT NULL,
  status character varying NOT NULL,
  log_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payment_logs_pkey PRIMARY KEY (id),
  CONSTRAINT payment_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payment_logs_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.payment_transactions(id)
);
CREATE TABLE public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  user_id uuid,
  gateway_id uuid,
  gateway_type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'refunded'::text, 'cancelled'::text])),
  transaction_reference text,
  gateway_transaction_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT payment_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT payment_transactions_gateway_id_fkey FOREIGN KEY (gateway_id) REFERENCES public.payment_gateways(id)
);
CREATE TABLE public.product_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  images jsonb DEFAULT '[]'::jsonb,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT product_reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT product_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.product_vat_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE,
  vat_rate numeric,
  vat_exempt boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_vat_overrides_pkey PRIMARY KEY (id),
  CONSTRAINT product_vat_overrides_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  category_id uuid,
  brand_id uuid,
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
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  currency_code text DEFAULT 'USD'::text,
  admin_approved boolean DEFAULT false,
  admin_notes text,
  rejection_reason text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  avatar_url text,
  role USER-DEFINED DEFAULT 'customer'::user_role,
  language_code text DEFAULT 'en'::text,
  currency_code text DEFAULT 'USD'::text,
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  city text,
  country text,
  street_address text,
  state text,
  zip_code text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  discount_type USER-DEFINED NOT NULL,
  discount_value numeric NOT NULL,
  product_ids ARRAY,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean DEFAULT true,
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone DEFAULT (now() + '30 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id),
  CONSTRAINT promotions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referee_id uuid NOT NULL,
  reward_amount numeric DEFAULT 10,
  status USER-DEFINED DEFAULT 'pending'::referral_status,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT referrals_pkey PRIMARY KEY (id),
  CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.profiles(id),
  CONSTRAINT referrals_referee_id_fkey FOREIGN KEY (referee_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid,
  requested_by uuid,
  approved_by uuid,
  refund_amount numeric NOT NULL,
  refund_reason text NOT NULL,
  refund_status text DEFAULT 'pending'::text CHECK (refund_status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'processed'::text])),
  refund_method text CHECK (refund_method = ANY (ARRAY['original_payment'::text, 'wallet'::text, 'bank_transfer'::text])),
  processed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id),
  CONSTRAINT refunds_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.shipping_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name text NOT NULL,
  description text,
  base_cost numeric NOT NULL DEFAULT 0,
  delivery_time_min integer NOT NULL DEFAULT 1,
  delivery_time_max integer NOT NULL DEFAULT 3,
  is_active boolean DEFAULT true,
  is_global boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  logistics_id uuid,
  min_order_total numeric DEFAULT 0,
  max_order_total numeric,
  CONSTRAINT shipping_methods_pkey PRIMARY KEY (id),
  CONSTRAINT shipping_methods_logistics_id_fkey FOREIGN KEY (logistics_id) REFERENCES public.logistics_profiles(id)
);
CREATE TABLE public.shipping_zones (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  name text NOT NULL,
  countries ARRAY,
  base_rate numeric NOT NULL,
  per_kg_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  logistics_id uuid,
  regions ARRAY DEFAULT '{}'::text[],
  min_order_total numeric DEFAULT 0,
  max_order_total numeric,
  CONSTRAINT shipping_zones_pkey PRIMARY KEY (id),
  CONSTRAINT shipping_zones_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT shipping_zones_logistics_id_fkey FOREIGN KEY (logistics_id) REFERENCES public.logistics_profiles(id)
);
CREATE TABLE public.site_content (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  is_published boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT site_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text NOT NULL,
  setting_type text DEFAULT 'general'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sms_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  api_key text,
  sender_id text,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sms_configurations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text,
  priority USER-DEFINED DEFAULT 'medium'::ticket_priority,
  status USER-DEFINED DEFAULT 'open'::ticket_status,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT support_tickets_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);
CREATE TABLE public.ticket_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ticket_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ticket_messages_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.support_tickets(id),
  CONSTRAINT ticket_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.transaction_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid,
  user_id uuid,
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  currency_code text DEFAULT 'USD'::text,
  status text DEFAULT 'completed'::text,
  reference_id text,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transaction_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_ledger_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id),
  CONSTRAINT transaction_ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.translations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  language_code text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT translations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.uploads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  file_name character varying NOT NULL,
  file_path text NOT NULL,
  file_type character varying,
  file_size integer,
  uploaded_by uuid,
  upload_type character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT uploads_pkey PRIMARY KEY (id),
  CONSTRAINT uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.user_role_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT user_role_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(id),
  CONSTRAINT user_role_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  role_description text,
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vat_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  vat_rate numeric NOT NULL CHECK (vat_rate >= 0::numeric AND vat_rate <= 100::numeric),
  vat_name text DEFAULT 'VAT'::text,
  is_active boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vat_configurations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vat_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  default_rate numeric DEFAULT 15.00,
  applies_to_products boolean DEFAULT true,
  applies_to_shipping boolean DEFAULT true,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  commission_enabled boolean DEFAULT true,
  commission_rate numeric DEFAULT 10.00,
  CONSTRAINT vat_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_ads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text,
  ad_type USER-DEFINED DEFAULT 'banner'::ad_type,
  status USER-DEFINED DEFAULT 'pending'::ad_status,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_ads_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_ads_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.vendor_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  contract_version text NOT NULL,
  terms_accepted boolean DEFAULT false,
  accepted_at timestamp with time zone,
  ip_address text,
  user_agent text,
  contract_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_contracts_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.vendor_currency_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  currency_code text NOT NULL,
  exchange_rate numeric NOT NULL CHECK (exchange_rate > 0::numeric),
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_currency_rates_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_currency_rates_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT vendor_currency_rates_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code)
);
CREATE TABLE public.vendor_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric DEFAULT 0,
  product_limit integer NOT NULL DEFAULT 10,
  has_ads_access boolean DEFAULT false,
  has_promotion_access boolean DEFAULT false,
  has_analytics_access boolean DEFAULT false,
  has_priority_support boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  has_catalog_management boolean DEFAULT false,
  has_stock_management boolean DEFAULT false,
  has_pos_access boolean DEFAULT false,
  has_orders_management boolean DEFAULT false,
  has_wallet_management boolean DEFAULT false,
  has_shipping_management boolean DEFAULT false,
  has_withdraw_management boolean DEFAULT false,
  has_shop_configurations boolean DEFAULT false,
  has_reports_management boolean DEFAULT false,
  has_customer_support boolean DEFAULT false,
  has_notifications boolean DEFAULT false,
  has_refund_management boolean DEFAULT false,
  has_kyc_verification boolean DEFAULT false,
  CONSTRAINT vendor_packages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_performance_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_orders integer DEFAULT 0,
  total_revenue numeric DEFAULT 0.00,
  total_products integer DEFAULT 0,
  average_rating numeric DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  order_fulfillment_rate numeric DEFAULT 0.00,
  average_delivery_time_days numeric DEFAULT 0.00,
  return_rate numeric DEFAULT 0.00,
  customer_satisfaction_score numeric DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_performance_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_performance_analytics_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id)
);
CREATE TABLE public.vendor_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_name text NOT NULL UNIQUE,
  plan_description text,
  price numeric NOT NULL,
  currency_code text DEFAULT 'USD'::text,
  billing_period text NOT NULL CHECK (billing_period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'annually'::text])),
  features jsonb DEFAULT '[]'::jsonb,
  product_limit integer,
  commission_rate numeric,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_pre_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  contact_person text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL UNIQUE,
  product_category text NOT NULL,
  city text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT vendor_pre_registrations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  shop_name text NOT NULL,
  shop_description text,
  shop_logo_url text,
  shop_banner_url text,
  business_email text,
  business_phone text,
  business_address text,
  tax_id text,
  kyc_status text DEFAULT 'none'::text,
  kyc_documents jsonb DEFAULT '[]'::jsonb,
  subscription_plan text DEFAULT 'basic'::text,
  subscription_expires_at timestamp with time zone,
  is_approved boolean DEFAULT false,
  total_sales numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  kyc_details jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.vendor_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_reviews_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendor_profiles(id),
  CONSTRAINT vendor_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.vendor_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL UNIQUE,
  package_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'cancelled'::text, 'expired'::text, 'pending'::text])),
  billing_cycle text NOT NULL DEFAULT 'monthly'::text CHECK (billing_cycle = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  current_period_start timestamp with time zone DEFAULT now(),
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_subscriptions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES auth.users(id),
  CONSTRAINT vendor_subscriptions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.vendor_packages(id)
);
CREATE TABLE public.vendor_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  subscription_id uuid,
  package_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  payment_gateway text NOT NULL CHECK (payment_gateway = ANY (ARRAY['stripe'::text, 'paypal'::text, 'paynow'::text])),
  payment_gateway_transaction_id text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['subscription'::text, 'upgrade'::text, 'renewal'::text])),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT vendor_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES auth.users(id),
  CONSTRAINT vendor_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.vendor_subscriptions(id),
  CONSTRAINT vendor_transactions_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.vendor_packages(id)
);
CREATE TABLE public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  status USER-DEFINED DEFAULT 'pending'::transaction_status,
  reference_id text,
  payment_method text,
  notes text,
  admin_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id)
);
CREATE TABLE public.wallet_transactions_detailed (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wallet_id uuid,
  transaction_type USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD'::text,
  balance_before numeric DEFAULT 0,
  balance_after numeric DEFAULT 0,
  reference_id uuid,
  reference_type text,
  description text NOT NULL,
  created_by uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wallet_transactions_detailed_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_detailed_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallets(id),
  CONSTRAINT wallet_transactions_detailed_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric DEFAULT 0,
  currency_code text DEFAULT 'USD'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  pending_balance numeric NOT NULL DEFAULT 0.00,
  total_earned numeric NOT NULL DEFAULT 0.00,
  total_withdrawn numeric NOT NULL DEFAULT 0.00,
  updated_at timestamp with time zone DEFAULT now(),
  balance_usd numeric DEFAULT 0,
  balance_zig numeric DEFAULT 0,
  total_commission_earned numeric DEFAULT 0,
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlists_pkey PRIMARY KEY (id),
  CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL DEFAULT 'USD'::text,
  status USER-DEFINED DEFAULT 'pending'::withdrawal_status,
  withdrawal_charges numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  requested_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  processed_by uuid,
  rejection_reason text,
  payment_method text,
  account_details jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT withdrawal_requests_pkey PRIMARY KEY (id),
  CONSTRAINT withdrawal_requests_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.profiles(id),
  CONSTRAINT withdrawal_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);