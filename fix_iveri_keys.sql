-- Remove curly braces {} from iVeri credentials in the database
-- Run this in your Supabase SQL Editor

UPDATE payment_gateways
SET configuration = jsonb_set(
    jsonb_set(
        configuration,
        '{application_id}',
        to_jsonb(
            REPLACE(REPLACE(configuration->>'application_id', '{', ''), '}', '')
        )
    ),
    '{certificate_id}',
    to_jsonb(
        REPLACE(REPLACE(configuration->>'certificate_id', '{', ''), '}', '')
    )
)
WHERE gateway_type = 'iveri';

-- Verify the cleanup
SELECT 
    gateway_type,
    configuration->>'application_id' as app_id,
    configuration->>'certificate_id' as cert_id
FROM payment_gateways
WHERE gateway_type = 'iveri';
