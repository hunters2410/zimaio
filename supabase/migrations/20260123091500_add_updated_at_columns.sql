-- Add updated_at to vendor_profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vendor_profiles' AND column_name='updated_at') THEN
        ALTER TABLE vendor_profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Add updated_at to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Add updated_at to categories if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='categories' AND column_name='updated_at') THEN
        ALTER TABLE categories ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- Add updated_at to brands if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='brands' AND column_name='updated_at') THEN
        ALTER TABLE brands ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;
