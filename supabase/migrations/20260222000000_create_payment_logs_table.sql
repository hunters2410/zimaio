-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payment_logs table
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    gateway_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- e.g., 'success', 'failed', 'pending_redirect'
    log_data JSONB NOT NULL,     -- The structured log object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add a comment explaining the table's purpose
COMMENT ON TABLE public.payment_logs IS 'Stores detailed compliance and debug logs from payment gateway interactions (like iVeri)';

-- Set up Row Level Security (RLS)
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all logs
CREATE POLICY "Admins can view all payment logs" 
    ON public.payment_logs 
    FOR SELECT 
    USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow service role full access (needed for Edge Function to insert)
CREATE POLICY "Service role can perform all actions on payment logs" 
    ON public.payment_logs 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Create an index for faster querying by order or transaction
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON public.payment_logs(created_at DESC);
