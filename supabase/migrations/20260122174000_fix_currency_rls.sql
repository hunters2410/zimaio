-- Fix Currency Management: Add missing columns and RLS policies

-- 1. Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'is_default') THEN
        ALTER TABLE currencies ADD COLUMN is_default boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'created_at') THEN
        ALTER TABLE currencies ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'currencies' AND column_name = 'updated_at') THEN
        ALTER TABLE currencies ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 2. Add RLS Policy for Admins to manage currencies
-- (Drop first to avoid duplicates if re-running)
DROP POLICY IF EXISTS "Admins can manage currencies" ON currencies;

CREATE POLICY "Admins can manage currencies"
  ON currencies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Ensure admins can see "inactive" currencies too (The existing policy limits to active only)
-- The above "Admins can manage currencies" FOR ALL covers SELECT for admins, so they can see everything.
-- The existing "Anyone can view active currencies" will apply to non-admins (or admins as well, but the admin policy grants broader access).
