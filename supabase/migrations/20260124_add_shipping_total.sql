-- Add shipping_total column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipping_total numeric(10,2) DEFAULT 0;

-- Comment on column
COMMENT ON COLUMN public.orders.shipping_total IS 'The calculated shipping cost for this order';

-- Refresh the schema cache (Supabase specific, although typically automatic)
NOTIFY pgrst, 'reload schema';
