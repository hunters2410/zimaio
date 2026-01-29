-- Create wishlists table to store user favorites
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Policies for wishlists
-- 1. Users can only see their own wishlist items
CREATE POLICY "Users can view their own wishlists"
    ON public.wishlists FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Users can only add items to their own wishlist
CREATE POLICY "Users can insert into their own wishlists"
    ON public.wishlists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Users can only remove items from their own wishlist
CREATE POLICY "Users can delete from their own wishlists"
    ON public.wishlists FOR DELETE
    USING (auth.uid() = user_id);

-- Performance Index
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON public.wishlists(product_id);

-- Grant permissions (just in case)
GRANT ALL ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
