/*
  # Add Featured Status to Vendor Profiles

  1. Changes
    - Add `is_featured` column to `vendor_profiles` table to allow admins to mark vendors as featured
    - Add `is_verified` column to `vendor_profiles` table for verified vendor status
    - Default value is `false` for both
    - Admins can toggle these fields to control which vendors appear on the homepage

  2. Notes
    - This allows admins to curate which vendors are prominently displayed
    - Featured vendors will be shown in the "Featured Vendor Shops" section on the homepage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE vendor_profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;
END $$;
