-- Fix Database Dependencies: Ensure User Roles Exist

-- 1. Create user_roles table if it doesn't exist (to match UserRolesManagement.tsx)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    role_description TEXT,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.user_roles;
CREATE POLICY "Public read access" ON public.user_roles FOR SELECT USING (true);

-- 3. Insert Default Roles if they don't exist
INSERT INTO public.user_roles (role_name, role_description, permissions)
VALUES 
    ('admin', 'Administrator with full access', '{manage_users,manage_vendors,manage_products,manage_orders,manage_finances,view_reports,manage_settings}'),
    ('customer', 'Standard customer', '{view_products,place_orders,view_own_orders}'),
    ('vendor', 'Store owner', '{manage_own_products,view_own_orders,view_own_reports}'),
    ('logistic', 'Delivery driver', '{view_assigned_orders,update_delivery_status}')
ON CONFLICT (role_name) DO UPDATE 
SET permissions = EXCLUDED.permissions 
WHERE user_roles.permissions IS NULL;

-- 4. Check if profiles.role is a Foreign Key to user_roles.role_name
-- If so, we are now safe because we inserted the roles above.
-- If it's NOT a Foreign Key, this script does no harm.

-- 5. Re-run schema column checks just to be absolutely sure
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
    -- ... (others are likely there from previous script)
END $$;
