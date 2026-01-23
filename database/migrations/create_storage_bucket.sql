-- Migration: Create public storage bucket and policies
-- Created: 2026-01-23

-- 1. Create the 'public' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public',
    'public',
    true,
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']::text[];

-- 2. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- 3. Enable RLS on objects (it should be enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- Policy: Allow public read access to all files in the 'public' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Policy: Allow authenticated users to upload files to the 'public' bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'public' 
    AND auth.role() = 'authenticated'
);

-- Policy: Allow users to update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'public' 
    AND auth.uid() = owner
);

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'public' 
    AND auth.uid() = owner
);

-- Verification
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public') THEN
        RAISE NOTICE 'SUCCESS: Public storage bucket created successfully.';
    ELSE
        RAISE EXCEPTION 'FAILED: Bucket creation failed.';
    END IF;
END $$;
