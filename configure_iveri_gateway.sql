-- ========================================
-- iVeri Payment Gateway Configuration
-- ========================================

-- Step 1: Check if the iVeri gateway exists and its configuration
SELECT 
    id,
    gateway_name,
    gateway_type,
    display_name,
    is_active,
    configuration,
    created_at
FROM payment_gateways 
WHERE gateway_type = 'iveri';

-- Step 2: Delete existing iVeri gateway if it exists
-- This ensures we start fresh with the correct configuration
DELETE FROM payment_gateways WHERE gateway_type = 'iveri';

-- Step 3: Insert the iVeri gateway configuration
-- ✅ Your Application ID has been added: 096e1ab1-1b99-4447-a089-251663c9e0fe

INSERT INTO payment_gateways (
    gateway_name,
    gateway_type,
    display_name,
    description,
    is_active,
    is_default,
    configuration,
    supported_currencies,
    sort_order
) VALUES (
    'iVeri Payment Gateway',
    'iveri',
    'Card Payment',
    'Pay securely with credit/debit card or EcoCash via iVeri',
    true,  -- ✅ Gateway is ACTIVE
    false,
    jsonb_build_object(
        'application_id', '096e1ab1-1b99-4447-a089-251663c9e0fe',
        'certificate_id', '{4c96973f-71dd-4044-802d-6e234effe8f2}',
        'mode', 'Test',  -- Using TEST mode
        'api_url', 'https://portal.host.iveri.com/api/transactions'
    ),
    ARRAY['USD', 'ZWL'],
    10
);

-- Step 4: Verify the configuration was saved correctly
SELECT 
    id,
    gateway_name,
    is_active,
    configuration->>'application_id' as app_id,
    configuration->>'mode' as mode,
    configuration->>'api_url' as api_url
FROM payment_gateways 
WHERE gateway_type = 'iveri';

-- Step 5: Check recent payment transactions
SELECT 
    id,
    gateway_type,
    amount,
    currency,
    status,
    error_message,
    created_at
FROM payment_transactions
WHERE gateway_type = 'iveri'
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: Check active payment gateways visible to users
SELECT 
    gateway_type,
    display_name,
    is_active,
    configuration->>'mode' as mode
FROM payment_gateways
WHERE is_active = true
ORDER BY sort_order;

-- ========================================
-- Test Card Numbers for iVeri Test Mode
-- ========================================
-- Successful Transaction: 4000000000000002
-- Declined Transaction:   5100000000000008
-- Expiry: Use format MMYY (e.g., 1225 for December 2025)
-- CVV: Any 3 digits (e.g., 123)
-- ========================================
