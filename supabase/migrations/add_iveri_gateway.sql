-- Add iVeri Payment Gateway
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
  logo_url,
  created_at,
  updated_at
)
SELECT 
  'iveri_gateway',
  'iveri',
  'iVeri Payments',
  'Secure online payment via Credit/Debit Card',
  true,
  false,
  '{"application_id": "", "certificate_id": "", "api_url": "https://portal.host.iveri.com/api/transactions", "base_url": "https://portal.iveri.com/Lite/Transactions/New/CheckOut"}',
  ARRAY['USD', 'ZWL', 'ZAR', 'EUR'],
  3,
  'https://www.iveri.com/images/iveri_logo.png',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_gateways WHERE gateway_name = 'iveri_gateway'
);

-- Ensure 'iveri' is a valid gateway_type if it's an enum (it seems to be text in schema based on insertion, but checking types).
-- If there is a check constraint on gateway_type, we might need to alter it. 
-- Assuming standard text column or I'd see a migration file for enums.
