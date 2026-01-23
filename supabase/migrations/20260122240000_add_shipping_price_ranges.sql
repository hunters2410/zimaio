-- ADD PRICE RANGE SUPPORT TO SHIPPING
-- This allows setting shipping rates based on the order total.

-- 1. Update shipping_methods with price tiers
ALTER TABLE public.shipping_methods 
ADD COLUMN IF NOT EXISTS min_order_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_order_total numeric;

-- 2. Update shipping_zones with price tiers
ALTER TABLE public.shipping_zones 
ADD COLUMN IF NOT EXISTS min_order_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_order_total numeric;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipping_methods_range ON public.shipping_methods(min_order_total, max_order_total);
CREATE INDEX IF NOT EXISTS idx_shipping_zones_range ON public.shipping_zones(min_order_total, max_order_total);

-- 3. Update comments/documentation if needed
COMMENT ON COLUMN public.shipping_methods.min_order_total IS 'Minimum order total required for this shipping method to be available.';
COMMENT ON COLUMN public.shipping_methods.max_order_total IS 'Maximum order total allowed for this shipping method. NULL means no upper limit.';
