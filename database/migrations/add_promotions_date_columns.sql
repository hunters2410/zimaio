-- Migration: Add start_date and end_date columns to promotions table
-- Created: 2026-01-23
-- Purpose: Fix missing date columns in promotions table

-- Add start_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE promotions ADD COLUMN start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE promotions ADD COLUMN end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days';
    END IF;
END $$;

-- Add created_at column if it doesn't exist (for consistency)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE promotions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE promotions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_promotions_updated_at_trigger ON promotions;
CREATE TRIGGER update_promotions_updated_at_trigger
    BEFORE UPDATE ON promotions
    FOR EACH ROW
    EXECUTE FUNCTION update_promotions_updated_at();

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_promotions_start_date ON promotions(start_date);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON promotions(end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates_active ON promotions(start_date, end_date, is_active);

-- Update existing rows to have valid dates if they're NULL
UPDATE promotions 
SET start_date = COALESCE(start_date, created_at, NOW())
WHERE start_date IS NULL;

UPDATE promotions 
SET end_date = COALESCE(end_date, start_date + INTERVAL '30 days', NOW() + INTERVAL '30 days')
WHERE end_date IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN promotions.start_date IS 'Promotion start date and time';
COMMENT ON COLUMN promotions.end_date IS 'Promotion end date and time';
COMMENT ON COLUMN promotions.created_at IS 'Timestamp when promotion was created';
COMMENT ON COLUMN promotions.updated_at IS 'Timestamp when promotion was last updated';

-- Verify the columns were added
DO $$
DECLARE
    start_date_exists BOOLEAN;
    end_date_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'start_date'
    ) INTO start_date_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'end_date'
    ) INTO end_date_exists;
    
    IF start_date_exists AND end_date_exists THEN
        RAISE NOTICE 'SUCCESS: start_date and end_date columns added to promotions table';
    ELSE
        RAISE EXCEPTION 'FAILED: Could not add date columns to promotions table';
    END IF;
END $$;
