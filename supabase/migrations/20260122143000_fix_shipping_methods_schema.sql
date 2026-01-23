-- Add missing 'regions' column to 'shipping_methods' table
-- This column is expected by some frontend components and its absence causes schema cache errors
ALTER TABLE shipping_methods ADD COLUMN IF NOT EXISTS regions text[];

-- Ensure shipping_zones also has regions (it should already, but being safe)
ALTER TABLE shipping_zones ADD COLUMN IF NOT EXISTS regions text[];
