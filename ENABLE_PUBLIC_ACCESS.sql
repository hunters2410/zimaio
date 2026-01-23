-- PUBLIC ACCESS RESTORATION SCRIPT
-- This script ensures that guests (anon) can view products, vendors, categories, and brands.

-- 1. Profiles (Public: id, full_name, role, avatar_url)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view basic profiles" ON public.profiles;
CREATE POLICY "Anyone can view basic profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- 2. Vendor Profiles (Public: approved vendors)
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view approved vendors" ON public.vendor_profiles;
CREATE POLICY "Anyone can view approved vendors" 
ON public.vendor_profiles FOR SELECT 
USING (is_approved = true OR user_id = auth.uid());

-- 3. Products (Public: active products)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" 
ON public.products FOR SELECT 
USING (is_active = true);

-- 4. Categories (Public: active categories)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories" 
ON public.categories FOR SELECT 
USING (is_active = true);

-- 5. Brands (Public: active brands)
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active brands" ON public.brands;
CREATE POLICY "Anyone can view active brands" 
ON public.brands FOR SELECT 
USING (is_active = true);

-- 6. Navigation items
ALTER TABLE public.navigation_menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view navigation" ON public.navigation_menu_items;
CREATE POLICY "Anyone can view navigation" 
ON public.navigation_menu_items FOR SELECT 
USING (is_active = true);

-- 7. Currencies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view currencies" ON public.currencies;
CREATE POLICY "Anyone can view currencies" 
ON public.currencies FOR SELECT 
USING (is_active = true);

-- 8. Site Settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings FOR SELECT 
USING (true);

-- 9. Home Slides
ALTER TABLE public.home_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view slides" ON public.home_slides;
CREATE POLICY "Anyone can view slides" 
ON public.home_slides FOR SELECT 
USING (is_active = true);

-- 10. Vendor Ads
ALTER TABLE public.vendor_ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.vendor_ads;
CREATE POLICY "Anyone can view active ads" 
ON public.vendor_ads FOR SELECT 
USING (status = 'active');

-- 11. Support public RPCs
GRANT EXECUTE ON FUNCTION public.increment_ad_impressions(uuid[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_ad_clicks(uuid) TO anon, authenticated;
