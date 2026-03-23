/*
  # Add staff and sub_admin to user_role ENUM

  1. Changes
    - Adds 'staff' to the existing `user_role` ENUM.
    - Adds 'sub_admin' to the existing `user_role` ENUM.

  This is necessary so the `profiles` table can store these role values
  for new admin users.
*/

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sub_admin';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Also let's update any existing sub_admin/staff roles in UserRolesManagement if needed.
-- But the ENUM addition alone is sufficient to fix the 400 Bad Request.
