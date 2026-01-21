-- Create storage bucket for shop assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for shop-assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'shop-assets' );

CREATE POLICY "Vendor Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'shop-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Vendor Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'shop-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Vendor Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'shop-assets' AND auth.role() = 'authenticated' );
