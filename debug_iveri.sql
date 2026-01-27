-- Improved Verification Query
SELECT 
    id, 
    created_at, 
    status, 
    -- 1. Check the main column
    transaction_reference,
    -- 2. Check path A (Transaction -> Result)
    metadata->'iveri_result'->'Transaction'->'Result'->>'RequestID' as id_path_a,
    -- 3. Check path B (Root -> Result)
    metadata->'iveri_result'->'Result'->>'RequestID' as id_path_b,
    -- 4. Dump the structure keys to see what's there
    jsonb_object_keys(metadata->'iveri_result') as top_keys
FROM payment_transactions 
WHERE gateway_type = 'iveri' 
ORDER BY created_at DESC 
LIMIT 1;
