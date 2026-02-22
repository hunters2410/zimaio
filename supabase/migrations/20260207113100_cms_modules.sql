-- Migration: Add CMS Modules for FAQ and Site Content
-- Description: Creates tables for FAQs and dynamic site pages (About Us, Shipping, Returns)

-- 1. Create FAQs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Site Content table (for About Us, Shipping, Returns, etc.)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- e.g., 'about-us', 'shipping-info', 'returns-policy'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read published faqs' AND tablename = 'faqs') THEN
        CREATE POLICY "Anyone can read published faqs" ON public.faqs FOR SELECT USING (is_published = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage faqs' AND tablename = 'faqs') THEN
        CREATE POLICY "Admins can manage faqs" ON public.faqs FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read published site content' AND tablename = 'site_content') THEN
        CREATE POLICY "Anyone can read published site content" ON public.site_content FOR SELECT USING (is_published = true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage site content' AND tablename = 'site_content') THEN
        CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        );
    END IF;
END $$;

-- 5. Seed Initial Data for ZimAIO

-- Seed FAQs
INSERT INTO public.faqs (question, answer, category, order_index) VALUES
('What is ZimAIO?', 'ZimAIO is Zimbabwe''s leading All-In-One ecosystem connecting vendors, customers, and logistics providers in a seamless digital marketplace.', 'General', 1),
('How do I become a vendor?', 'You can sign up as a vendor by clicking the "Become a Vendor" button in the footer and completing the KYC verification process.', 'Vendor', 2),
('What payment methods are supported?', 'We support multiple payment gateways including Paynow (EcoCash, OneMoney, ZimSwitch), iVeri for Visa/Mastercard, and our internal wallet system.', 'Payments', 3),
('How long does shipping take within Zimbabwe?', 'Standard delivery within major cities (Harare, Bulawayo) takes 12-48 hours. Regional deliveries may take 3-5 business days.', 'Shipping', 4);

-- Seed Site Pages with matching slugs
INSERT INTO public.site_content (slug, title, content) VALUES
('about', 'About ZimAIO', 'ZimAIO was founded with a mission to digitize the Zimbabwean economy. We provide a robust platform for local businesses to reach customers nationwide, backed by reliable logistics and secure payment systems.'),
('shipping', 'Shipping Information', 'We partner with the best logistics providers in Zimbabwe to ensure your parcels arrive safely. Rates are calculated based on weight and distance. You can track your order in real-time through our dashboard.'),
('returns', 'Returns & Refunds', 'Items can be returned within 7 days of delivery if they are in original condition. Refunds are processed back to your ZimAIO wallet or original payment method within 3-5 business days of inspection.')
ON CONFLICT (slug) DO UPDATE SET 
    title = EXCLUDED.title,
    content = EXCLUDED.content;
