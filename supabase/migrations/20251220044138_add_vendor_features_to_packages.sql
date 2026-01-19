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
