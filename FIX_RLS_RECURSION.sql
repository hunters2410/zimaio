-- Fix for "infinite recursion" in profiles policies

-- The recursive issue happens because "Admins can manage all profiles" selects from 'profiles' to check if the user is an admin.
-- When RLS checks permissions for that SELECT, it triggers the policy again, and again.

-- 1. Use a specialized function to check admin status without recursing on the profiles table (via auth.jwt() metadata if available)
-- OR, just use a simpler policy structure that avoids looking up the table itself for the current user's role if possible.
-- BUT, since we store roles in the public.profiles table, we MUST break the recursion.

-- Strategy:
-- Create a SECURITY DEFINER function to check admin role. 
-- SECURITY DEFINER functions run with the privileges of the creator (postgres/admin), bypassing RLS on the table.

CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. NOW update the policies to use this function instead of the direct subquery
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old/conflicting policies
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles; -- Dropping previous similar named one just in case

-- Drop policies we are about to create to ensure idempotency
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Policy: Authenticated users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Admins can do EVERYTHING (using the secure function to break recursion)
CREATE POLICY "Admins can do everything on profiles" ON public.profiles
    FOR ALL USING (is_admin());

-- Policy: Allow INSERT by users for themselves (registration)
-- We don't use is_admin() here because new users aren't admins yet.
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
