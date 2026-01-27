-- Query to inspect the full raw metadata
-- Run this to see exactly what was saved
SELECT 
    id,
    created_at,
    status,
    metadata
FROM 
    payment_transactions
WHERE 
    gateway_type = 'iveri'
ORDER BY 
    created_at DESC
LIMIT 1;
