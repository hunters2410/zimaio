/*
  # Patch all existing roles to include all 15 feature permission keys

  Ensures that every role in user_roles has a full permissions object
  covering all 15 feature modules. Any missing keys default to all-false.

  Features:
    customers, vendors, products, orders, financial, analytics, settings,
    support, delivery, kyc, roles, refunds, coupons, reviews, notifications
*/

-- Helper: merge existing permissions with defaults for any missing keys
DO $$
DECLARE
  default_perm jsonb := jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false);
  all_keys text[] := ARRAY[
    'customers','vendors','products','orders','financial','analytics',
    'settings','support','delivery','kyc','roles','refunds','coupons',
    'reviews','notifications'
  ];
  key text;
  role_row record;
  updated_perms jsonb;
BEGIN
  FOR role_row IN SELECT id, permissions FROM user_roles LOOP
    updated_perms := COALESCE(role_row.permissions, '{}'::jsonb);
    FOREACH key IN ARRAY all_keys LOOP
      -- If key is missing from this role's permissions, add default false object
      IF NOT (updated_perms ? key) THEN
        updated_perms := updated_perms || jsonb_build_object(key, default_perm);
      END IF;
    END LOOP;
    -- Write back if changed
    IF updated_perms <> COALESCE(role_row.permissions, '{}'::jsonb) THEN
      UPDATE user_roles SET permissions = updated_perms WHERE id = role_row.id;
    END IF;
  END LOOP;
END $$;

-- Also update the get_user_permissions function to include all 15 keys in admin fallback
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  user_perms jsonb;
BEGIN
  -- If admin, return all permissions
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'customers',     jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'vendors',       jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'products',      jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'orders',        jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'financial',     jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'analytics',     jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'settings',      jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'support',       jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'delivery',      jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'kyc',           jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'roles',         jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'refunds',       jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'coupons',       jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'reviews',       jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'notifications', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
    );
  END IF;

  -- Aggregate all role permissions for the user
  SELECT jsonb_object_agg(feature, feature_perms)
  INTO user_perms
  FROM (
    SELECT 
      feature,
      jsonb_build_object(
        'create', bool_or((perms -> feature ->> 'create')::boolean),
        'read',   bool_or((perms -> feature ->> 'read')::boolean),
        'update', bool_or((perms -> feature ->> 'update')::boolean),
        'delete', bool_or((perms -> feature ->> 'delete')::boolean)
      ) as feature_perms
    FROM (
      SELECT 
        ur.permissions as perms,
        jsonb_object_keys(ur.permissions) as feature
      FROM user_role_assignments ura
      JOIN user_roles ur ON ur.id = ura.role_id
      WHERE ura.user_id = user_uuid
        AND ur.is_active = true
        AND (ura.expires_at IS NULL OR ura.expires_at > now())
    ) sub
    GROUP BY feature
  ) final;

  RETURN COALESCE(user_perms, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user_has_permission function similarly
CREATE OR REPLACE FUNCTION user_has_permission(
  user_uuid uuid,
  feature_name text,
  permission_type text
) RETURNS boolean AS $$
DECLARE
  has_perm boolean;
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;

  -- Check user's role permissions
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    JOIN user_roles ur ON ur.id = ura.role_id
    WHERE ura.user_id = user_uuid
      AND ur.is_active = true
      AND (ura.expires_at IS NULL OR ura.expires_at > now())
      AND (ur.permissions -> feature_name ->> permission_type)::boolean = true
  ) INTO has_perm;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
