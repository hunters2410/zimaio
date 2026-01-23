-- Enable Delivery Tracking and Logistic Linking

-- 1. Add schema links
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method_id uuid REFERENCES shipping_methods(id);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS logistics_id uuid REFERENCES logistics_profiles(id);

-- 2. Create RPC for Tracking Page (Publicly accessible via RLS or SECURITY DEFINER)
-- We use SECURITY DEFINER to allow looking up details without complex RLS, but limit by tracking number.
CREATE OR REPLACE FUNCTION get_delivery_details(p_tracking_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_delivery json;
    v_history json;
BEGIN
    -- Fetch delivery details with related info
    SELECT json_build_object(
        'id', d.id,
        'tracking_number', d.tracking_number,
        'delivery_status', d.delivery_status,
        'delivery_address', d.delivery_address,
        'customer_phone', d.customer_phone,
        'created_at', d.created_at,
        'pickup_time', d.pickup_time,
        'delivery_time', d.delivery_time,
        'delivery_notes', d.delivery_notes,
        'order', json_build_object(
            'total_amount', o.total,
            'order_status', o.status
        ),
        'vendor', json_build_object(
            'full_name', vp.shop_name, -- Use Shop Name for vendor
            'phone', vp.business_phone
        ),
        'driver', CASE WHEN dd.id IS NOT NULL THEN json_build_object(
            'driver_name', dd.driver_name,
            'phone_number', dd.phone_number,
            'vehicle_type', dd.vehicle_type,
            'vehicle_number', dd.vehicle_number
        ) ELSE null END
    ) INTO v_delivery
    FROM deliveries d
    JOIN orders o ON d.order_id = o.id
    JOIN vendor_profiles vp ON d.vendor_id = vp.id
    LEFT JOIN delivery_drivers dd ON d.driver_id = dd.id
    WHERE d.tracking_number = p_tracking_number;

    IF v_delivery IS NULL THEN
        RETURN null;
    END IF;

    -- Fetch history
    SELECT json_agg(
        json_build_object(
            'id', h.id,
            'status', h.status,
            'location', h.location,
            'notes', h.notes,
            'created_at', h.created_at
        ) ORDER BY h.created_at DESC
    ) INTO v_history
    FROM delivery_tracking_history h
    WHERE h.delivery_id = (v_delivery->>'id')::uuid;

    RETURN json_build_object(
        'delivery', v_delivery,
        'history', COALESCE(v_history, '[]'::json)
    );
END;
$$;

-- 3. Trigger to Auto-Create Delivery
CREATE OR REPLACE FUNCTION create_delivery_for_processed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_logistics_id uuid;
    v_tracking_number text;
BEGIN
    -- Only run when status changes to processing (paid)
    IF NEW.status = 'processing' AND (OLD.status IS DISTINCT FROM 'processing') THEN
        
        -- Check if delivery already exists
        IF EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Find logistics provider from shipping method
        -- If shipping_method_id is null, it might be a digital product or fallback
        IF NEW.shipping_method_id IS NOT NULL THEN
            SELECT logistics_id INTO v_logistics_id
            FROM shipping_methods
            WHERE id = NEW.shipping_method_id;
        END IF;

        -- Generate Tracking
        -- Assuming generate_tracking_number() exists from previous migrations. If not, simple generation:
        v_tracking_number := 'TRK' || floor(random() * 899999999 + 100000000)::text;

        -- Update Order with Tracking Number
        UPDATE orders SET tracking_number = v_tracking_number WHERE id = NEW.id;

        -- Create Delivery Record
        INSERT INTO deliveries (
            order_id,
            customer_id,
            vendor_id,
            logistics_id,
            delivery_address,
            customer_phone,
            delivery_status,
            tracking_number
        ) VALUES (
            NEW.id,
            NEW.customer_id,
            NEW.vendor_id,
            v_logistics_id, -- Can be NULL if no provider linked
            NEW.shipping_address->>'address_line1' || ' ' || COALESCE(NEW.shipping_address->>'city', ''), -- extract address details
            NEW.shipping_address->>'phone'::text, -- assuming phone is in address json or profiles
            'pending',
            v_tracking_number
        );

        -- Add initial history
        INSERT INTO delivery_tracking_history (
            delivery_id,
            status,
            notes
        ) SELECT id, 'pending', 'Order processed, awaiting dispatch'
        FROM deliveries WHERE booking_ref = v_tracking_number OR tracking_number = v_tracking_number
        LIMIT 1;

    END IF;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_create_delivery ON orders;

-- Create Trigger
CREATE TRIGGER trigger_create_delivery
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE PROCEDURE create_delivery_for_processed_order();

-- 4. Grant access to public for RPC (if needed)
GRANT EXECUTE ON FUNCTION get_delivery_details(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_delivery_details(text) TO anon;
