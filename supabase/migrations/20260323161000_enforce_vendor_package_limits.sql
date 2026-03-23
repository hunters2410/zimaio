-- Migration: enforce_vendor_package_limits
-- Description: Adds logic to enforce product limits and handle subscription expiration.

-- 1. Product Limit Enforcement
CREATE OR REPLACE FUNCTION check_vendor_product_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_vendor_user_id uuid;
    v_current_count integer;
    v_limit integer;
    v_sub_status text;
BEGIN
    -- Get the vendor's user_id from vendor_profiles
    SELECT user_id INTO v_vendor_user_id 
    FROM vendor_profiles 
    WHERE id = NEW.vendor_id;

    -- Get the current product count for this vendor
    SELECT count(*) INTO v_current_count 
    FROM products 
    WHERE vendor_id = NEW.vendor_id;

    -- Get the package limit and subscription status
    SELECT p.product_limit, s.status INTO v_limit, v_sub_status
    FROM vendor_subscriptions s
    JOIN vendor_packages p ON s.package_id = p.id
    WHERE s.vendor_id = v_vendor_user_id;

    -- Check if subscription is active
    IF v_sub_status != 'active' THEN
        RAISE EXCEPTION 'This vendor account has no active subscription.';
    END IF;

    -- Check limit
    IF v_current_count >= v_limit THEN
        RAISE EXCEPTION 'Product limit reached. This vendor is limited to % products by their current package.', v_limit;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_vendor_product_limit_trigger ON products;
CREATE TRIGGER enforce_vendor_product_limit_trigger
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_vendor_product_limit();


-- 2. Subscription Expiration & Demotion logic
CREATE OR REPLACE FUNCTION sync_vendor_subscription_status()
RETURNS TRIGGER AS $$
DECLARE
    v_free_package_id uuid;
BEGIN
    -- If subscription has expired
    IF NEW.current_period_end < now() AND NEW.status = 'active' THEN
        -- Get the Free package ID
        SELECT id INTO v_free_package_id FROM vendor_packages WHERE is_default = true LIMIT 1;
        
        -- Transition to Free plan
        IF v_free_package_id IS NOT NULL THEN
            NEW.package_id := v_free_package_id;
            NEW.status := 'active'; -- Keep it active as a free plan
            NEW.current_period_end := NULL; -- Free plan doesn't expire
            NEW.current_period_start := now();
            
            -- Ensure profile is active (in case it was previously suspended)
            UPDATE profiles SET is_active = true WHERE id = NEW.vendor_id;
        ELSE
            -- Fallback: If no free plan, mark as expired and suspend
            NEW.status := 'expired';
            UPDATE profiles SET is_active = false WHERE id = NEW.vendor_id;
        END IF;
    END IF;
    
    -- If subscription is being reactivated (e.g. manual status change)
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
        UPDATE profiles SET is_active = true WHERE id = NEW.vendor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_vendor_subscription_status_trigger ON vendor_subscriptions;
CREATE TRIGGER sync_vendor_subscription_status_trigger
    BEFORE UPDATE ON vendor_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_vendor_subscription_status();


-- 3. Utility Function to manually trigger expiry/demotion check
CREATE OR REPLACE FUNCTION check_all_subscriptions_expiry()
RETURNS void AS $$
DECLARE
    v_free_package_id uuid;
BEGIN
    SELECT id INTO v_free_package_id FROM vendor_packages WHERE is_default = true LIMIT 1;

    -- Bulk transition expired subscriptions to Free plan
    IF v_free_package_id IS NOT NULL THEN
        UPDATE vendor_subscriptions
        SET 
            package_id = v_free_package_id,
            status = 'active',
            current_period_end = NULL,
            current_period_start = now()
        WHERE current_period_end < now() AND status = 'active';

        -- Ensure all vendors with active free plans are active profiles
        UPDATE profiles
        SET is_active = true
        WHERE id IN (
            SELECT vendor_id FROM vendor_subscriptions WHERE status = 'active'
        ) AND role = 'vendor';
    ELSE
        -- Fallback to old behavior if no Free plan found
        UPDATE vendor_subscriptions
        SET status = 'expired'
        WHERE current_period_end < now() AND status = 'active';

        UPDATE profiles
        SET is_active = false
        WHERE id IN (
            SELECT vendor_id FROM vendor_subscriptions WHERE status = 'expired'
        ) AND role = 'vendor';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Helper function for frontend to get package limit
CREATE OR REPLACE FUNCTION get_vendor_package_limit(vendor_user_id uuid)
RETURNS integer AS $$
DECLARE
    v_limit integer;
BEGIN
    SELECT p.product_limit INTO v_limit
    FROM vendor_subscriptions s
    JOIN vendor_packages p ON s.package_id = p.id
    WHERE s.vendor_id = vendor_user_id
    AND s.status = 'active';

    RETURN COALESCE(v_limit, 0);
END;
$$ LANGUAGE plpgsql;
