
-- Create product_reviews table
CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendor_reviews table
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for product_reviews
CREATE POLICY "Product reviews are viewable by everyone" 
ON public.product_reviews FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert product reviews" 
ON public.product_reviews FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own product reviews" 
ON public.product_reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Policies for vendor_reviews
CREATE POLICY "Vendor reviews are viewable by everyone" 
ON public.vendor_reviews FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert vendor reviews" 
ON public.vendor_reviews FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own vendor reviews" 
ON public.vendor_reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger to update vendor average rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.vendor_profiles
    SET rating = (
        SELECT AVG(rating)::NUMERIC(3,2)
        FROM public.vendor_reviews
        WHERE vendor_id = NEW.vendor_id
    )
    WHERE id = NEW.vendor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vendor_review_added
AFTER INSERT OR UPDATE ON public.vendor_reviews
FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();
