-- Fix Database Schema and Trigger for User Creation

-- 1. Ensure columns exist in profiles table (Safe to run multiple times)
DO $$ 
BEGIN 
    -- Add phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;

    -- Add currency_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'currency_code') THEN
        ALTER TABLE public.profiles ADD COLUMN currency_code TEXT DEFAULT 'USD';
    END IF;

    -- Add language_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'language_code') THEN
        ALTER TABLE public.profiles ADD COLUMN language_code TEXT DEFAULT 'en';
    END IF;

    -- Add is_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. Update the Trigger Function to be extra robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_role TEXT;
    v_phone TEXT;
    v_currency_code TEXT;
    v_language_code TEXT;
    v_is_active BOOLEAN;
BEGIN
    -- Extract values safely
    v_full_name := new.raw_user_meta_data->>'full_name';
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
    v_phone := new.raw_user_meta_data->>'phone';
    v_currency_code := COALESCE(new.raw_user_meta_data->>'currency_code', 'USD');
    v_language_code := COALESCE(new.raw_user_meta_data->>'language_code', 'en');
    
    -- Handle boolean conversion safely
    BEGIN
        v_is_active := (new.raw_user_meta_data->>'is_active')::boolean;
    EXCEPTION WHEN OTHERS THEN
        v_is_active := true;
    END;
    v_is_active := COALESCE(v_is_active, true);

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
        v_full_name,
        v_role,
        v_phone,
        v_currency_code,
        v_language_code,
        v_is_active
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verify Trigger Association
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
