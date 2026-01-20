-- Support Login Checks and create missing login_attempts if needed

-- 1. Ensure login_attempts exists (used by AuthContext)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    success BOOLEAN,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on login_attempts (public can insert, admins can view)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert login attempts" ON public.login_attempts;
CREATE POLICY "Public can insert login attempts" ON public.login_attempts
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view login attempts" ON public.login_attempts;
CREATE POLICY "Admins can view login attempts" ON public.login_attempts
    FOR SELECT USING (public.is_admin());

-- 3. Ensure profiles has is_active and it defaults to true (already done, but good to double check)
-- This is the master switch for login.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;
