CREATE TABLE IF NOT EXISTS public.vendor_pre_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    product_category TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendor_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the pre-registration form)
CREATE POLICY "Allow public inserts for vendor pre-registration"
ON public.vendor_pre_registrations
FOR INSERT
WITH CHECK (true);

-- Allow admins to view the registrations
CREATE POLICY "Allow admins to view vendor pre-registrations"
ON public.vendor_pre_registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
