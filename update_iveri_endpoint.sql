-- Update iVeri to use CORRECT REST API endpoint
-- The old URL (https://portal.iveri.com/Enterprise/REST) doesn't exist!
-- 
-- Choose the correct endpoint based on your acquiring bank:
-- 1. Nedbank: https://portal.nedsecure.co.za/api/transactions
-- 2. CSC: https://portal.cscacquiring.com/api/transactions
-- 3. iVeri Direct (most common for Zimbabwe): https://portal.host.iveri.com/api/transactions
-- 4. CIM Mauritius: https://portal.merchant.cim.mu/api/transactions

-- Update to iVeri Direct endpoint (recommended for Zimbabwe)
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{api_url}',
  '"https://portal.host.iveri.com/api/transactions"'::jsonb
)
WHERE gateway_type = 'iveri';

-- Verify the update
SELECT 
  gateway_type,
  configuration->>'api_url' as api_url,
  configuration->>'mode' as mode,
  configuration->>'application_id' as application_id
FROM payment_gateways
WHERE gateway_type = 'iveri';
