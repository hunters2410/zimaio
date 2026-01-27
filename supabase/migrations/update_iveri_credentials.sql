
-- Update iVeri Gateway Configuration
-- Replace the placeholders with your actual iVeri credentials.

UPDATE public.payment_gateways
SET configuration = jsonb_build_object(
    'application_id', '{YOUR_APPLICATION_ID}', -- e.g. {3b80...}
    'certificate_id', '{YOUR_CERTIFICATE_ID}', -- e.g. {4c96...}
    'api_url', 'https://portal.host.iveri.com/api/transactions',
    'base_url', 'https://portal.iveri.com/Lite/Transactions/New/CheckOut',
    'mode', 'Live' -- or 'Test'
)
WHERE gateway_type = 'iveri';
