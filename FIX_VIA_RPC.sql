-- SOLUTION: Use a Secure Server-Side Function (RPC) to Create Customer Profiles
-- This avoids RLS (Row Level Security) conflicts entirely because the function runs with System Privileges.

CREATE OR REPLACE FUNCTION public.create_customer_profile_secure(
    p_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_currency_code TEXT,
    p_language_code TEXT,
    p_is_active BOOLEAN
)
RETURNS JSONB AS $$
BEGIN
    -- This function is 'SECURITY DEFINER', meaning it bypasses the user's RLS policies
    -- and runs with the permissions of the database owner.
    
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
        p_id, 
        p_email, 
        p_full_name, 
        'customer', 
        p_phone, 
        p_currency_code, 
        p_language_code, 
        p_is_active
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        currency_code = EXCLUDED.currency_code,
        language_code = EXCLUDED.language_code,
        is_active = EXCLUDED.is_active,
        role = 'customer';

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
