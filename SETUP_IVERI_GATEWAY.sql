-- iVeri Payment Gateway Setup and Verification Script
-- Run this in Supabase SQL Editor

-- ==============================================
-- STEP 1: Check if iVeri gateway exists
-- ==============================================
SELECT 
    gateway_name,
    gateway_type,
    display_name,
    is_active,
    configuration,
    created_at
FROM payment_gateways 
WHERE gateway_type = 'iveri';

-- If the above returns NO ROWS, run this to add iVeri:
-- ==============================================
-- STEP 2: Add iVeri Gateway (if not exists)
-- ==============================================
INSERT INTO public.payment_gateways (
  gateway_name,
  gateway_type,
  display_name,
  description,
  is_active,
  is_default,
  configuration,
  supported_currencies,
  sort_order,
  logo_url
)
SELECT 
  'iveri_gateway',
  'iveri',
  'iVeri Payments',
  'Secure online payment via Credit/Debit Card and EcoCash',
  true,  -- Set to true to activate immediately (if you have credentials)
  false,
  jsonb_build_object(
    'application_id', '',  -- FILL THIS IN
    'certificate_id', '',  -- FILL THIS IN
    'api_url', 'https://portal.host.iveri.com/api/transactions',
    'base_url', 'https://portal.iveri.com/Lite/Transactions/New/CheckOut',
    'mode', 'Test'  -- Change to 'Live' for production
  ),
  ARRAY['USD', 'ZWL', 'ZAR', 'EUR'],
  1,  -- First in sort order
  'https://www.iveri.com/images/iveri_logo.png'
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_gateways WHERE gateway_type = 'iveri'
);

-- ==============================================
-- STEP 3: Update iVeri Credentials (REQUIRED!)
-- ==============================================
-- Replace {YOUR_APPLICATION_ID} and {YOUR_CERTIFICATE_ID} with your actual credentials
UPDATE public.payment_gateways
SET 
  configuration = jsonb_build_object(
    'application_id', '{YOUR_APPLICATION_ID}',  -- e.g., {3b80a4c8-1234-5678-90ab-cdefabcdef12}
    'certificate_id', '{YOUR_CERTIFICATE_ID}',  -- e.g., {4c96b5d9-1234-5678-90ab-cdefabcdef12}
    'api_url', 'https://portal.host.iveri.com/api/transactions',
    'base_url', 'https://portal.iveri.com/Lite/Transactions/New/CheckOut',
    'mode', 'Test'  -- Change to 'Live' for production
  ),
  is_active = true  -- Activate the gateway
WHERE gateway_type = 'iveri';

-- ==============================================
-- STEP 4: Verify Configuration
-- ==============================================
SELECT 
    gateway_name,
    display_name,
    is_active,
    configuration->>'application_id' as app_id_status,
    configuration->>'certificate_id' as cert_id_status,
    configuration->>'mode' as mode,
    supported_currencies
FROM payment_gateways 
WHERE gateway_type = 'iveri';

-- Expected Result:
-- - is_active should be: true
-- - app_id_status should show your actual ID (not empty)
-- - cert_id_status should show your actual ID (not empty)
-- - mode should be: 'Test' or 'Live'

-- ==============================================
-- STEP 5: Ensure RLS allows public access
-- ==============================================
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Check existing policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'payment_gateways';

-- Create policy if needed (only if not already exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'payment_gateways' 
        AND policyname = 'Anyone can view active gateways'
    ) THEN
        CREATE POLICY "Anyone can view active gateways" 
        ON public.payment_gateways 
        FOR SELECT 
        USING (is_active = true);
    END IF;
END $$;

-- ==============================================
-- STEP 6: Test Query (What customers will see)
-- ==============================================
-- This simulates what the checkout page queries
SELECT 
    id,
    gateway_name,
    gateway_type,
    display_name,
    description,
    logo_url
FROM payment_gateways 
WHERE is_active = true
ORDER BY sort_order;

-- You should see iVeri in this list!

NOTIFY pgrst, 'reload schema';
