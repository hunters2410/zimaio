-- Ultra-robust storage policies for product images
-- First, ensure the bucket is public and exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = null,
    allowed_mime_types = null;

-- Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Vendor Upload" ON storage.objects;
DROP POLICY IF EXISTS "Vendor Update" ON storage.objects;
DROP POLICY IF EXISTS "Vendor Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public_Select_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Auth_Insert_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Auth_Update_Policy" ON storage.objects;
DROP POLICY IF EXISTS "Auth_Delete_Policy" ON storage.objects;

-- 1. Public Select (Anyone can view images)
CREATE POLICY "Public_Select_Policy"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

-- 2. Authenticated Insert (Any logged in user can upload)
CREATE POLICY "Auth_Insert_Policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'product-images' );

-- 3. Authenticated Update (Any logged in user can update)
CREATE POLICY "Auth_Update_Policy"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'product-images' );

-- 4. Authenticated Delete (Any logged in user can delete)
CREATE POLICY "Auth_Delete_Policy"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'product-images' );

-- Grant necessary schema permissions just in case
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;
