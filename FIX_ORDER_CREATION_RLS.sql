-- Comprehensive RLS Fix for Checkout Process
-- Run this in the Supabase SQL Editor

-- 1. Orders Table Policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert their own orders
DROP POLICY IF EXISTS "Customers can insert own orders" ON public.orders;
CREATE POLICY "Customers can insert own orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = customer_id);

-- Allow customers to view their own orders (and Vendors to view assigned orders)
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- Allow customers to update their own orders (if needed, e.g. cancelling)
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders" 
ON public.orders 
FOR UPDATE
TO authenticated 
USING (auth.uid() = customer_id);

-- 2. Order Items Table Policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow customers to insert items for their orders
-- This relies on the user having SELECT permission on the parent order
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

-- 3. Profiles Table Policies (for address updates during checkout)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (if not automatically created)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 4. Payment Transactions Table Policies (for client-side recorded transactions like PayPal)
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own transactions
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.payment_transactions;
CREATE POLICY "Users can insert own transactions" 
ON public.payment_transactions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" 
ON public.payment_transactions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Refresh Schema
NOTIFY pgrst, 'reload schema';
