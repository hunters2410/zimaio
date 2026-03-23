-- Migration: Ensure Vendor Ads Schema and Analytics RPCs
-- Description: Creates vendor_ads table and tracking functions

-- 1. Create vendor_ads table if not exists
CREATE TABLE IF NOT EXISTS public.vendor_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    ad_type TEXT NOT NULL CHECK (ad_type IN ('banner', 'sidebar', 'popup', 'featured')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired', 'banned')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_date TIMESTAMPTZ NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view active ads' AND tablename = 'vendor_ads') THEN
        CREATE POLICY "Anyone can view active ads" ON public.vendor_ads
            FOR SELECT USING (status = 'active');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Vendors can manage own ads' AND tablename = 'vendor_ads') THEN
        CREATE POLICY "Vendors can manage own ads" ON public.vendor_ads
            FOR ALL TO authenticated USING (
                vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage all ads' AND tablename = 'vendor_ads') THEN
        CREATE POLICY "Admins can manage all ads" ON public.vendor_ads
            FOR ALL TO authenticated USING (
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
    END IF;
END $$;

-- 4. Create Analytics RPCs
CREATE OR REPLACE FUNCTION increment_ad_impressions(ad_ids UUID[])
RETURNS VOID AS $$
BEGIN
    UPDATE public.vendor_ads
    SET impressions = impressions + 1
    WHERE id = ANY(ad_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_ad_clicks(ad_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.vendor_ads
    SET clicks = clicks + 1
    WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vendor_ads_updated_at ON public.vendor_ads;
CREATE TRIGGER update_vendor_ads_updated_at
    BEFORE UPDATE ON public.vendor_ads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
