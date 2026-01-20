-- Fix: Use valid JSON syntax for permissions since the column is JSON/JSONB
INSERT INTO public.user_roles (role_name, role_description, permissions)
VALUES 
    ('admin', 'Administrator with full access', '["manage_users", "manage_vendors", "manage_products", "manage_orders", "manage_finances", "view_reports", "manage_settings"]'),
    ('customer', 'Standard customer', '["view_products", "place_orders", "view_own_orders"]'),
    ('vendor', 'Store owner', '["manage_own_products", "view_own_orders", "view_own_reports"]'),
    ('logistic', 'Delivery driver', '["view_assigned_orders", "update_delivery_status"]')
ON CONFLICT (role_name) DO UPDATE 
SET permissions = EXCLUDED.permissions 
WHERE user_roles.permissions IS NULL;
