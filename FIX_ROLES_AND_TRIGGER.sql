-- MASTER FIX: Roles, Permissions, and User Creation Trigger

-- 1. Ensure user_roles table exists and has correct columns
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    permissions JSONB DEFAULT '[]'::jsonb, -- Using JSONB is better for performance/flexibility
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Populate Standard Roles (Using correct JSON syntax to avoid previous errors)
-- We use ON CONFLICT to ensure we don't duplicate or error if they exist.
INSERT INTO public.user_roles (role_name, role_description, permissions)
VALUES 
    ('admin', 'Administrator with full access', '["manage_users", "manage_vendors", "manage_products", "manage_orders", "manage_finances", "view_reports", "manage_settings"]'::jsonb),
    ('customer', 'Standard customer', '["view_products", "place_orders", "view_own_orders"]'::jsonb),
    ('vendor', 'Store owner', '["manage_own_products", "view_own_orders", "view_own_reports"]'::jsonb),
    ('logistic', 'Delivery driver', '["view_assigned_orders", "update_delivery_status"]'::jsonb)
ON CONFLICT (role_name) DO UPDATE 
SET permissions = EXCLUDED.permissions;

-- 3. Update the handle_new_user trigger to be resilient
-- We add an EXCEPTION block to ensure that even if the role constraint fails, the user is still created (with a fallback or null role)
-- This prevents the "Database error saving new user" generic error.
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

    -- Attempt to insert the profile
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
    EXCEPTION WHEN foreign_key_violation THEN
        -- Fallback: If 'customer' role doesn't exist in user_roles, try inserting without role constraint (or null role)
        -- Ideally, we shouldn't hit this if step 2 ran correctly.
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (new.id, new.email, v_full_name, 'customer')
        ON CONFLICT (id) DO NOTHING;
    END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-apply Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
