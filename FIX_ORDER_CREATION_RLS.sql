-- Fix RLS for Orders and Order Items to allow customer creation

-- 1. Orders Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert their own orders
DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
CREATE POLICY "Customers can insert own orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- 2. Order Items Table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert items for their orders
-- Note: This relies on the order already existing or being created in the same transaction
DROP POLICY IF EXISTS "Customers can insert own order items" ON public.order_items;
CREATE POLICY "Customers can insert own order items" 
ON public.order_items 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.customer_id = auth.uid()
    )
);

-- Allow viewing of order items if user can view the order
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" 
ON public.order_items 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND (orders.customer_id = auth.uid() OR orders.vendor_id = auth.uid())
    )
);

-- 3. Shipping Addresses (if stored in separate table, but they seem to be JSON inside orders)

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
