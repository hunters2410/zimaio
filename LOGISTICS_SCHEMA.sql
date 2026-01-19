-- SQL for Logistics Module (Idempotent Version)

-- 1. Create delivery_drivers table (No changes needed if already exists)
-- Ensure profiles policy allows insertion during signup (Fix for "new row violates row-level security policy for table profiles")
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
-- We need to check if there is a generic insert policy, if not create one that allows users to insert their own profile
-- CAUTION: Allowing public insert to profiles can be risky if not scoped. 
-- Usually Supabase handles this via triggers from auth.users, but if we are manually inserting/upserting:

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Also ensure admins can manage profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    (auth.jwt() ->> 'role') = 'service_role' -- Allow service role if applicable
);

-- For the specific case where an admin creates a NEW user (who doesn't have a profile yet), 
-- the admin needs permission to insert into profiles for THAT new user ID.
-- Standard Admin policy "FOR ALL" usually covers this IF the admin has a profile with role='admin'.
-- BUT, sometimes recursive policy checks fail if the admin's own profile is being checked against the same table.

-- Let's try to add a specific INSERT policy for admins that doesn't rely on self-lookup if possible, or keep it simple.
CREATE POLICY "Admins can insert any profile" ON public.profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    driver_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('motorcycle', 'car', 'van', 'truck')),
    vehicle_number TEXT NOT NULL,
    is_available BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id)
);

-- 3. Create deliveries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_number TEXT UNIQUE NOT NULL,
    order_id UUID NOT NULL, -- Link to orders table
    customer_id UUID NOT NULL REFERENCES public.profiles(id),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id),
    driver_id UUID REFERENCES public.delivery_drivers(id),
    delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
    delivery_address TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_notes TEXT,
    pickup_time TIMESTAMP WITH TIME ZONE,
    delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 5. Policies for delivery_drivers
DROP POLICY IF EXISTS "Public drivers are viewable by everyone" ON public.delivery_drivers;
CREATE POLICY "Public drivers are viewable by everyone" ON public.delivery_drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update their own profile" ON public.delivery_drivers;
CREATE POLICY "Drivers can update their own profile" ON public.delivery_drivers FOR UPDATE USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Drivers can insert their own profile" ON public.delivery_drivers;
CREATE POLICY "Drivers can insert their own profile" ON public.delivery_drivers FOR INSERT WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.delivery_drivers;
CREATE POLICY "Admins can insert profiles" ON public.delivery_drivers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can manage all drivers" ON public.delivery_drivers;
CREATE POLICY "Admins can manage all drivers" ON public.delivery_drivers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 6. Policies for deliveries
DROP POLICY IF EXISTS "Deliveries are viewable by involved parties" ON public.deliveries;
CREATE POLICY "Deliveries are viewable by involved parties" ON public.deliveries
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = vendor_id OR 
        auth.uid() IN (SELECT profile_id FROM public.delivery_drivers WHERE id = driver_id) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Drivers can update their assigned deliveries" ON public.deliveries;
CREATE POLICY "Drivers can update their assigned deliveries" ON public.deliveries
    FOR UPDATE USING (
        auth.uid() IN (SELECT profile_id FROM public.delivery_drivers WHERE id = driver_id)
    );

DROP POLICY IF EXISTS "Admins can manage all deliveries" ON public.deliveries;
CREATE POLICY "Admins can manage all deliveries" ON public.deliveries
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. Create delivery_tracking_history for history tracking
CREATE TABLE IF NOT EXISTS public.delivery_tracking_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Enable RLS for history
ALTER TABLE public.delivery_tracking_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "History viewable by involved parties" ON public.delivery_tracking_history;
CREATE POLICY "History viewable by involved parties" ON public.delivery_tracking_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            WHERE d.id = delivery_id AND (
                auth.uid() = d.customer_id OR 
                auth.uid() = d.vendor_id OR 
                auth.uid() IN (SELECT profile_id FROM public.delivery_drivers WHERE id = d.driver_id) OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            )
        )
    );

-- 9. RPC Function to update delivery status and log it
CREATE OR REPLACE FUNCTION update_delivery_status(
    delivery_id_param UUID,
    new_status TEXT,
    location_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    -- Update delivery
    UPDATE public.deliveries
    SET 
        delivery_status = new_status,
        updated_at = now(),
        delivery_time = CASE WHEN new_status = 'delivered' THEN now() ELSE delivery_time END,
        pickup_time = CASE WHEN new_status = 'picked_up' THEN now() ELSE pickup_time END
    WHERE id = delivery_id_param;

    -- Insert log
    INSERT INTO public.delivery_tracking_history (delivery_id, status, location, notes)
    VALUES (delivery_id_param, new_status, location_param, notes_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant Permissions
GRANT ALL ON public.delivery_drivers TO anon, authenticated, service_role;
GRANT ALL ON public.deliveries TO anon, authenticated, service_role;
GRANT ALL ON public.delivery_tracking_history TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_delivery_status TO authenticated;
