-- Safely update or insert vendor packages to avoid foreign key violations
DO $$
BEGIN
    -- 1. Starter Shop (formerly Free)
    IF EXISTS (SELECT 1 FROM vendor_packages WHERE name IN ('Starter Shop', 'Free')) THEN
        UPDATE vendor_packages SET
            name = 'Starter Shop',
            description = 'Perfect for getting started with your digital storefront',
            price_monthly = 0,
            price_yearly = 0,
            product_limit = 50,
            is_active = true,
            is_default = true,
            sort_order = 1,
            has_catalog_management = true,
            has_stock_management = true,
            has_orders_management = true,
            has_notifications = true,
            has_shop_configurations = true,
            has_wallet_management = false,
            has_shipping_management = false,
            has_reports_management = false,
            has_customer_support = false,
            has_pos_access = true,
            has_withdraw_management = false,
            has_refund_management = false,
            has_kyc_verification = false,
            has_analytics_access = false,
            has_priority_support = false,
            has_ads_access = false,
            has_promotion_access = false
        WHERE name IN ('Starter Shop', 'Free');
    ELSE
        INSERT INTO vendor_packages (name, description, price_monthly, price_yearly, product_limit, is_active, is_default, sort_order, has_catalog_management, has_stock_management, has_orders_management, has_notifications, has_shop_configurations, has_pos_access)
        VALUES ('Starter Shop', 'Perfect for getting started with your digital storefront', 0, 0, 50, true, true, 1, true, true, true, true, true, true);
    END IF;

    -- 2. Business Pro (formerly Pro or Basic)
    -- We'll prioritize renaming 'Pro' to 'Business Pro'
    IF EXISTS (SELECT 1 FROM vendor_packages WHERE name = 'Pro') THEN
        UPDATE vendor_packages SET
            name = 'Business Pro',
            description = 'Advanced features for growing businesses',
            price_monthly = 29.00,
            price_yearly = 290.00,
            product_limit = 500,
            is_active = true,
            is_default = false,
            sort_order = 2,
            has_catalog_management = true,
            has_stock_management = true,
            has_orders_management = true,
            has_notifications = true,
            has_shop_configurations = true,
            has_wallet_management = true,
            has_shipping_management = true,
            has_reports_management = true,
            has_customer_support = true,
            has_pos_access = true,
            has_withdraw_management = false,
            has_refund_management = false,
            has_kyc_verification = false,
            has_analytics_access = true,
            has_priority_support = false,
            has_ads_access = true,
            has_promotion_access = false
        WHERE name = 'Pro';
    ELSIF EXISTS (SELECT 1 FROM vendor_packages WHERE name = 'Business Pro') THEN
         UPDATE vendor_packages SET
            description = 'Advanced features for growing businesses',
            price_monthly = 29.00,
            price_yearly = 290.00,
            product_limit = 500,
            is_active = true,
            is_default = false,
            sort_order = 2,
            has_catalog_management = true,
            has_stock_management = true,
            has_orders_management = true,
            has_notifications = true,
            has_shop_configurations = true,
            has_wallet_management = true,
            has_shipping_management = true,
            has_reports_management = true,
            has_customer_support = true,
            has_pos_access = true,
            has_withdraw_management = false,
            has_refund_management = false,
            has_kyc_verification = false,
            has_analytics_access = true,
            has_priority_support = false,
            has_ads_access = true,
            has_promotion_access = false
        WHERE name = 'Business Pro';
    ELSE
        INSERT INTO vendor_packages (name, description, price_monthly, price_yearly, product_limit, is_active, is_default, sort_order, has_catalog_management, has_stock_management, has_orders_management, has_notifications, has_shop_configurations, has_wallet_management, has_shipping_management, has_reports_management, has_customer_support, has_analytics_access, has_ads_access, has_pos_access)
        VALUES ('Business Pro', 'Advanced features for growing businesses', 29.00, 290.00, 500, true, false, 2, true, true, true, true, true, true, true, true, true, true, true, true);
    END IF;

    -- 3. Unlimited Elite (formerly Enterprise)
    IF EXISTS (SELECT 1 FROM vendor_packages WHERE name IN ('Unlimited Elite', 'Enterprise')) THEN
        UPDATE vendor_packages SET
            name = 'Unlimited Elite',
            description = 'The ultimate solution for large scale operations',
            price_monthly = 99.00,
            price_yearly = 990.00,
            product_limit = 999999,
            is_active = true,
            is_default = false,
            sort_order = 3,
            has_catalog_management = true,
            has_stock_management = true,
            has_orders_management = true,
            has_notifications = true,
            has_shop_configurations = true,
            has_wallet_management = true,
            has_shipping_management = true,
            has_reports_management = true,
            has_customer_support = true,
            has_pos_access = true,
            has_withdraw_management = true,
            has_refund_management = true,
            has_kyc_verification = true,
            has_analytics_access = true,
            has_priority_support = true,
            has_ads_access = true,
            has_promotion_access = true
        WHERE name IN ('Unlimited Elite', 'Enterprise');
    ELSE
        INSERT INTO vendor_packages (name, description, price_monthly, price_yearly, product_limit, is_active, is_default, sort_order, has_catalog_management, has_stock_management, has_orders_management, has_notifications, has_shop_configurations, has_wallet_management, has_shipping_management, has_reports_management, has_customer_support, has_pos_access, has_withdraw_management, has_refund_management, has_kyc_verification, has_analytics_access, has_priority_support, has_ads_access, has_promotion_access)
        VALUES ('Unlimited Elite', 'The ultimate solution for large scale operations', 99.00, 990.00, 999999, true, false, 3, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true);
    END IF;

    -- 4. Deactivate old/unused packages (like Basic)
    UPDATE vendor_packages 
    SET is_active = false 
    WHERE name NOT IN ('Starter Shop', 'Business Pro', 'Unlimited Elite');

END $$;
