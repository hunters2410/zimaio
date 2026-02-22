CREATE TABLE IF NOT EXISTS public.customer_pre_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company_name TEXT,
    mobile_number TEXT NOT NULL,
    city_area TEXT NOT NULL,
    interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_pre_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for the pre-registration form)
CREATE POLICY "Allow public inserts for pre-registration"
ON public.customer_pre_registrations
FOR INSERT
WITH CHECK (true);

-- Allow admins to view the registrations
CREATE POLICY "Allow admins to view pre-registrations"
ON public.customer_pre_registrations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
