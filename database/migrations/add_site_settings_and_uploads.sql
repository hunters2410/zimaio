-- Migration: Add image upload support and system settings
-- Created: 2026-01-23

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if they don't exist
INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES
    ('site_name', 'ZimAIO Marketplace', 'text'),
    ('site_tagline', 'Everything you need, all in one place', 'text'),
    ('site_logo', '/zimaio_mineral_edition,_no_background_v1.2.png', 'image'),
    ('footer_text', '© 2026 ZimAIO. All rights reserved.', 'text'),
    ('support_email', 'support@zimaio.com', 'email'),
    ('sales_email', 'sales@zimaio.com', 'email'),
    ('contact_phone', '+263 77 123 4567', 'text'),
    ('office_address', '123 Samora Machel Ave, Harare', 'text'),
    ('facebook_url', 'https://facebook.com/zimaio', 'url'),
    ('twitter_url', 'https://twitter.com/zimaio', 'url'),
    ('instagram_url', 'https://instagram.com/zimaio', 'url'),
    ('font_family', 'Inter', 'text'),
    ('maintenance_mode', 'false', 'boolean'),
    ('ga_id', '', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- Add image_url column to home_slides if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'home_slides' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE home_slides ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Create uploads table for file management
CREATE TABLE IF NOT EXISTS uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    upload_type VARCHAR(50), -- 'logo', 'slider', 'product', 'banner', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(upload_type);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Only admins can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Anyone can view uploads" ON uploads;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON uploads;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON uploads;
DROP POLICY IF EXISTS "Admins can delete any upload" ON uploads;

-- Policies for site_settings (read for all, write for admin only)
CREATE POLICY "Anyone can read site settings"
    ON site_settings FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update site settings"
    ON site_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can insert site settings"
    ON site_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for uploads
CREATE POLICY "Anyone can view uploads"
    ON uploads FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can upload files"
    ON uploads FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own uploads"
    ON uploads FOR DELETE
    USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can delete any upload"
    ON uploads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for site_settings
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE site_settings IS 'Stores global site configuration settings';
COMMENT ON TABLE uploads IS 'Stores file upload metadata and paths';
COMMENT ON COLUMN site_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN site_settings.setting_value IS 'The value of the setting';
COMMENT ON COLUMN site_settings.setting_type IS 'Type of setting (text, image, url, boolean, etc.)';
