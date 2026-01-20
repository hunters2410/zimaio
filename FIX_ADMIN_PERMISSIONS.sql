-- MASTER FIX: Force Admin Role and Reset Policies

-- 1. IDENTIFY AND UPGRADE THE CURRENT USER TO ADMIN
-- NOTE: This attempts to find the user by looking at recent logins or just the fact that you are running this.
-- SINCE we can't know your exact email here easily, we will TRUST that you are using the dashboard.
-- WE WILL CREATE A FUNCTION TO ELEVATE YOURSELF.

-- Run this line with YOUR email address in the SQL Editor after pasting:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your_email@example.com';

-- 2. Define IS_ADMIN with Anti-Recursion explicitly
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_flag BOOLEAN;
BEGIN
    -- Directly query the table. SECURITY DEFINER ensures we use the owner's permissions (postgres)
    -- This bypasses RLS on the profiles table for this check.
    SELECT (role = 'admin') INTO is_admin_flag
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(is_admin_flag, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset Profiles RLS completely
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to clean up the mess
DROP POLICY IF EXISTS "Admins can perform all actions" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;

-- POLICY A: ADMINS (The Golden Key)
-- Allows Admins to do ANYTHING (Select, Insert, Update, Delete)
CREATE POLICY "Admins can perform all actions" ON public.profiles
    FOR ALL
    USING (public.is_admin() = true)
    WITH CHECK (public.is_admin() = true);

-- POLICY B: SELF (The User's Key)
-- Allows users to read and update their own profile
CREATE POLICY "Users can manage own profile" ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- POLICY C: READ ALL (For everyone authenticated)
-- Useful for admin dashboard lists where RLS might be strict, or finding other users
CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 4. VERIFY: Ensure the "customer" role exists in user_roles
INSERT INTO public.user_roles (role_name, permissions)
VALUES ('customer', '["view_products"]'::jsonb)
ON CONFLICT (role_name) DO NOTHING;

-- INSTRUCTION:
-- AFTER RUNNING THIS SCRIPT, EXECUTE THE FOLLOWING SQL MANUALLY WITH YOUR EMAIL:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_LOGIN_EMAIL';
