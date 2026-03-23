-- Grant Staff role permissions to manage other users (roles feature)
UPDATE user_roles 
SET permissions = permissions || jsonb_build_object(
  'roles', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
)
WHERE role_name = 'Staff';

-- Also ensure 'sub_admin' role has these permissions if it exists
UPDATE user_roles 
SET permissions = permissions || jsonb_build_object(
  'roles', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
)
WHERE role_name = 'Sub-Admin' OR role_name = 'sub_admin';
