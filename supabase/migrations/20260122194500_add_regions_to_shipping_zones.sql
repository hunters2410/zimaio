-- Add regions column to shipping_zones
ALTER TABLE shipping_zones 
ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}';

-- Optional: Migrate data from countries if needed, but assuming fresh or compatible usage
-- UPDATE shipping_zones SET regions = countries WHERE regions IS NULL AND countries IS NOT NULL;
