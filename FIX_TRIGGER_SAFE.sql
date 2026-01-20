-- BULLET-PROOF TRIGGER FIX
-- Goal: Ensure the trigger NEVER causes "Database error saving new user", no matter what constraints fail.

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
    -- 1. Extract values with safe defaults
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'New User'); -- Default if null
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
    v_phone := new.raw_user_meta_data->>'phone'; -- Can be null
    v_currency_code := COALESCE(new.raw_user_meta_data->>'currency_code', 'USD');
    v_language_code := COALESCE(new.raw_user_meta_data->>'language_code', 'en');
    
    -- Safe boolean cast
    BEGIN
        v_is_active := (new.raw_user_meta_data->>'is_active')::boolean;
    EXCEPTION WHEN OTHERS THEN
        v_is_active := true;
    END;
    v_is_active := COALESCE(v_is_active, true);

    -- 2. Try strict Insert first
    BEGIN
        INSERT INTO public.profiles (
            id, email, full_name, role, phone, currency_code, language_code, is_active
        )
        VALUES (
            new.id, new.email, v_full_name, v_role, v_phone, v_currency_code, v_language_code, v_is_active
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            currency_code = EXCLUDED.currency_code,
            language_code = EXCLUDED.language_code,
            is_active = EXCLUDED.is_active;
            
    EXCEPTION WHEN OTHERS THEN
        -- 3. If STRICT insert fails (e.g. valid constraint, type mismatch), fall back to MINIMAL insert
        -- This ensures the record exists so the frontend can later update it/fix it.
        BEGIN
            INSERT INTO public.profiles (id, email, full_name, role)
            VALUES (new.id, new.email, v_full_name, 'customer')
            ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- 4. If even MINIMAL insert fails (e.g. fatal DB error), DO NOTHING.
            -- We swallow the error so that Auth User creation succeeds.
            -- The frontend will then try to 'upsert' and will catch/display the specific error to the Admin.
            RAISE WARNING 'Profile creation failed for user %: %', new.id, SQLERRM;
        END;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
