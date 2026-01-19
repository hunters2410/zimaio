/*
  # Enhanced Roles & Permissions System

  1. Changes
    - Add default system roles (Staff, Accountant, Support)
    - Create comprehensive permissions structure
    - Add helper functions for permission checking
    - Update RLS policies for role-based access

  2. Permissions Structure
    Each feature has four permission levels:
    - create: Add new records
    - read: View records
    - update: Modify existing records  
    - delete: Remove records

  3. Features with Permissions
    - customers: Customer management
    - vendors: Vendor management
    - products: Product catalog management
    - orders: Order processing
    - financial: Wallet, transactions, commissions
    - analytics: Reports and analytics
    - settings: System configuration
    - support: Support tickets
    - delivery: Delivery management
    - kyc: KYC verification
    - roles: Role and permission management
    - refunds: Refund processing
    - coupons: Coupon management
    - reviews: Review management
    - notifications: Notification management
*/

-- Insert default roles if they don't exist
DO $$
BEGIN
  -- Staff Role: Basic operational access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Staff') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Staff',
      'General staff member with basic operational access',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'financial', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', true),
        'notifications', jsonb_build_object('create', true, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;

  -- Accountant Role: Financial access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Accountant') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Accountant',
      'Financial management and reporting access',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'orders', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'financial', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'notifications', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;

  -- Support Role: Customer support access
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role_name = 'Support') THEN
    INSERT INTO user_roles (role_name, role_description, permissions, is_active) VALUES (
      'Support',
      'Customer support and ticket management',
      jsonb_build_object(
        'customers', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'vendors', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'orders', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'financial', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'analytics', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'settings', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'delivery', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', false),
        'kyc', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'roles', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false),
        'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'coupons', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'reviews', jsonb_build_object('create', false, 'read', true, 'update', true, 'delete', true),
        'notifications', jsonb_build_object('create', true, 'read', true, 'update', false, 'delete', false)
      ),
      true
    );
  END IF;
END $$;

-- Create function to check if user has permission
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

-- Create function to get user permissions
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
      'customers', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'vendors', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'orders', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'financial', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'analytics', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'settings', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'support', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'delivery', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'kyc', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'roles', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'refunds', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'coupons', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'reviews', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
      'notifications', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
    );
  END IF;

  -- Aggregate all role permissions for the user
  SELECT jsonb_object_agg(
    feature,
    jsonb_build_object(
      'create', bool_or((perms -> feature ->> 'create')::boolean),
      'read', bool_or((perms -> feature ->> 'read')::boolean),
      'update', bool_or((perms -> feature ->> 'update')::boolean),
      'delete', bool_or((perms -> feature ->> 'delete')::boolean)
    )
  )
  INTO user_perms
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
  GROUP BY feature;

  RETURN COALESCE(user_perms, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
