-- EMERGENCY SCHEMA REFRESH
-- Run this if you see "column not found" or "schema cache" errors

-- 1. Ensure columns exist in delivery_drivers
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_drivers' AND column_name='status') THEN
        ALTER TABLE public.delivery_drivers ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='delivery_drivers' AND column_name='is_available') THEN
        ALTER TABLE public.delivery_drivers ADD COLUMN is_available BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Ensure columns exist in deliveries
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='driver_id') THEN
        ALTER TABLE public.deliveries ADD COLUMN driver_id UUID REFERENCES public.delivery_drivers(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='pickup_time') THEN
        ALTER TABLE public.deliveries ADD COLUMN pickup_time TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deliveries' AND column_name='delivery_time') THEN
        ALTER TABLE public.deliveries ADD COLUMN delivery_time TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- 4. Re-grant permissions just in case
GRANT ALL ON public.delivery_drivers TO anon, authenticated, service_role;
GRANT ALL ON public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON public.delivery_tracking_history TO anon, authenticated, service_role;
