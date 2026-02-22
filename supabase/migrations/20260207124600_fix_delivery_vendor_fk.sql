-- Fix Delivery Schema Inconsistency: deliveries.vendor_id should reference vendor_profiles(id)
-- This fixes the FK violation when creating deliveries during order processing.

DO $$ 
BEGIN
    -- 1. Drop the incorrect constraint
    ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_vendor_id_fkey;
    
    -- 2. Add the correct constraint pointing to vendor_profiles
    ALTER TABLE deliveries 
    ADD CONSTRAINT deliveries_vendor_id_fkey 
    FOREIGN KEY (vendor_id) REFERENCES vendor_profiles(id) ON DELETE CASCADE;

    -- 3. Also fix the trigger robustly just in case (optional but good practice)
    -- The trigger already uses NEW.vendor_id which is a vendor_profiles.id
END $$;

-- Update the trigger function again to ensure it's robust
CREATE OR REPLACE FUNCTION create_delivery_for_processed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_logistics_id uuid;
    v_tracking_number text;
    v_address text;
    v_phone text;
BEGIN
    -- Only run when status changes to processing (paid)
    IF NEW.status = 'processing' AND (OLD.status IS DISTINCT FROM 'processing') THEN
        
        -- Check if delivery already exists
        IF EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id) THEN
            RETURN NEW;
        END IF;

        -- Find logistics provider from shipping method
        IF NEW.shipping_method_id IS NOT NULL THEN
            SELECT logistics_id INTO v_logistics_id
            FROM shipping_methods
            WHERE id = NEW.shipping_method_id;
        END IF;

        -- Generate Tracking
        v_tracking_number := 'TRK' || floor(random() * 899999999 + 100000000)::text;

        -- Update Order with Tracking Number
        UPDATE orders SET tracking_number = v_tracking_number WHERE id = NEW.id;

        -- Extract address details robustly
        v_address := concat_ws(', ', 
            NULLIF(trim(COALESCE(NEW.shipping_address->>'street', NEW.shipping_address->>'address_line1', '')), ''),
            NULLIF(trim(COALESCE(NEW.shipping_address->>'city', '')), ''),
            NULLIF(trim(COALESCE(NEW.shipping_address->>'state', '')), '')
        );
        
        IF v_address IS NULL OR v_address = '' THEN
            v_address := 'Address details not provided';
        END IF;

        -- Extract phone robustly
        v_phone := COALESCE(
            NEW.shipping_address->>'phone', 
            (SELECT phone FROM profiles WHERE id = NEW.customer_id),
            'Not Provided'
        );

        -- Create Delivery Record
        -- NEW.vendor_id is a vendor_profiles.id, matching our new constraint
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
            v_logistics_id,
            v_address,
            v_phone,
            'pending',
            v_tracking_number
        );

        -- Add initial history
        INSERT INTO delivery_tracking_history (
            delivery_id,
            status,
            notes
        ) 
        SELECT id, 'pending', 'Order processed, awaiting dispatch'
        FROM deliveries 
        WHERE order_id = NEW.id
        LIMIT 1;

    END IF;
    RETURN NEW;
END;
$$;
