# Supabase Storage Bucket Setup Guide

## Step 1: Create Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** button
4. Configure the bucket:

```
Bucket name: public
Public bucket: ✅ YES (checked)
File size limit: 5242880 (5MB in bytes)
Allowed MIME types: image/*
```

5. Click **"Create bucket"**

## Step 2: Set Bucket Policies

After creating the bucket, set up the policies:

### Option A: Using Supabase Dashboard UI

1. Click on the **"public"** bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Create the following policies:

**Policy 1: Public Read Access**
```
Policy name: Public read access
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 2: Authenticated Upload**
```
Policy name: Authenticated users can upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: true
```

**Policy 3: Users can delete own files**
```
Policy name: Users can delete own uploads
Allowed operation: DELETE
Target roles: authenticated
USING expression: (bucket_id = 'public')
```

### Option B: Using SQL (Recommended)

Run this SQL in the **SQL Editor**:

```sql
-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'public',
    'public',
    true,
    5242880,
    ARRAY['image/*']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/*']::text[];

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;

-- Allow public read access to all files in public bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'public' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'public' 
    AND auth.uid() = owner
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'public' 
    AND auth.uid() = owner
);
```

## Step 3: Verify Setup

Run this query to verify the bucket was created:

```sql
SELECT * FROM storage.buckets WHERE id = 'public';
```

You should see:
- `id`: public
- `name`: public
- `public`: true
- `file_size_limit`: 5242880
- `allowed_mime_types`: {image/*}

## Step 4: Test Upload

Try uploading a logo or slider image from the admin panel. It should now work!

## Folder Structure

The system will create these folders automatically:
```
public/
├── logos/          (Site logos)
└── slides/         (Slider images)
```

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket name is exactly `public`
- Verify the bucket exists in Storage dashboard

### Error: "Access denied"
- Check that the bucket is set to **public**
- Verify the policies are created correctly

### Error: "File too large"
- Check file size limit (should be 5MB = 5242880 bytes)
- Reduce image size before uploading

### Error: "Invalid file type"
- Only image files are allowed (PNG, JPG, JPEG, GIF, SVG, WebP)
- Check the `allowed_mime_types` setting

## Security Notes

✅ **Public bucket** is safe for:
- Logos
- Slider images
- Product images
- Public assets

❌ **Don't store** in public bucket:
- User documents
- Private files
- Sensitive data

For private files, create a separate private bucket with different policies.
