-- 1. Update the handle_new_user trigger to handle ALL profile fields from metadata
-- This allows the system to create the full profile during SignUp, avoiding RLS issues with client-side updates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    phone,
    currency_code,
    language_code,
    is_active
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'currency_code', 'USD'),
    COALESCE(new.raw_user_meta_data->>'language_code', 'en'),
    COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    currency_code = EXCLUDED.currency_code,
    language_code = EXCLUDED.language_code,
    is_active = EXCLUDED.is_active;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Make sure the Trigger is applied
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update is_admin to be robust and secure
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. EMERGENCY FIX: Ensure RLS policies are correct (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can perform all actions" ON public.profiles;
CREATE POLICY "Admins can perform all actions" ON public.profiles
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profile info" ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');
    
-- INSTRUCTIONS FOR USER:
-- If you are still seeing RLS errors, your user might not have the 'admin' role in the database.
-- Run the following command (uncommented and with your email) in the SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your_email@example.com';
