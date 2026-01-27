-- Query to verify iVeri communication in payment_transactions
-- Run this in the Supabase SQL Editor

-- 1. Get the most recent iVeri transaction
SELECT 
    id as transaction_id,
    created_at,
    status,
    amount,
    -- Extract the RequestID which proves iVeri generated a receipt
    metadata->'iveri_result'->'Transaction'->'Result'->>'RequestID' as iveri_request_id,
    -- Extract the Description to see "Approved" or error message
    metadata->'iveri_result'->'Transaction'->'Result'->>'Description' as iveri_description,
    -- Extract the Status Code (0 = Success)
    metadata->'iveri_result'->'Transaction'->'Result'->>'Status' as iveri_status_code
FROM 
    payment_transactions
WHERE 
    gateway_type = 'iveri'
ORDER BY 
    created_at DESC
LIMIT 1;
