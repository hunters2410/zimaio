-- Fix for "invalid input value for enum user_role: 'logistic'"

-- 1. Attempt to add the value to the enum if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'logistic';
    END IF;
END $$;

-- 2. Just in case it's a text column with a check constraint (common in some setups), let's relax/update that too
-- Note: The error message strongly suggests an ENUM, but being thorough doesn't hurt if we check existence first.

DO $$
BEGIN
    -- Check if there is a constraint named 'user_roles_check' or 'profiles_role_check' and drop/recreate
    -- This is harder to do safely without knowing exact name, but the ENUM fix above is primary.
    NULL;
END $$;
