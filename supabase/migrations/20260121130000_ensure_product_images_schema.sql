-- Ensure the images column exists on the products table and has the correct type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    ELSE
        -- Ensure it's jsonb if it already exists
        ALTER TABLE products ALTER COLUMN images TYPE jsonb USING images::jsonb;
    END IF;
END $$;

-- Ensure the storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure storage policies are robust
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

DROP POLICY IF EXISTS "Vendor Upload" ON storage.objects;
CREATE POLICY "Vendor Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Vendor Update" ON storage.objects;
CREATE POLICY "Vendor Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Vendor Delete" ON storage.objects;
CREATE POLICY "Vendor Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );
