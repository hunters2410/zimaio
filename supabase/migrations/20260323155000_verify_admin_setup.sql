-- Ensure the admin@zimaio.com user has the 'admin' role in the profiles table
UPDATE profiles 
SET role = 'admin', is_active = true 
WHERE email = 'admin@zimaio.com';

-- Ensure they have an admin role assignment
DO $$
DECLARE
  v_user_id uuid;
  v_role_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'admin@zimaio.com';
  SELECT id INTO v_role_id FROM user_roles WHERE role_name = 'admin';
  
  IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL THEN
    INSERT INTO user_role_assignments (user_id, role_id, assigned_at)
    VALUES (v_user_id, v_role_id, now())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;
