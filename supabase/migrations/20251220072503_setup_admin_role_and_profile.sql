/*
  # Setup Admin Role and Profile for Payment Gateway Access
  
  Creates admin role, profile, and assigns role to the admin user.
  
  1. New Data
    - Creates 'admin' role if it doesn't exist
    - Creates profile for admin@zimaio.com user
    - Assigns admin role to admin user
  
  2. Permissions
    - Admin role gets full access to payment gateways
  
  3. Important Notes
    - Required for admin to view and configure payment gateways
    - Creates profile first to satisfy foreign key constraints
*/

-- Insert admin role if it doesn't exist
INSERT INTO user_roles (role_name, role_description, is_active)
VALUES (
  'admin',
  'System administrator with full access to all features',
  true
)
ON CONFLICT (role_name) DO NOTHING;

-- Create profile and assign admin role
DO $$
DECLARE
  admin_user_id uuid;
  admin_role_id uuid;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@zimaio.com';
  
  -- Get admin role ID
  SELECT id INTO admin_role_id
  FROM user_roles
  WHERE role_name = 'admin';
  
  -- Only proceed if both exist
  IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    -- Create profile if it doesn't exist
    INSERT INTO profiles (id, email, full_name, role, is_active, is_verified, created_at)
    VALUES (
      admin_user_id,
      'admin@zimaio.com',
      'System Administrator',
      'admin',
      true,
      true,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO user_role_assignments (user_id, role_id, assigned_by, assigned_at)
    VALUES (admin_user_id, admin_role_id, admin_user_id, now())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
