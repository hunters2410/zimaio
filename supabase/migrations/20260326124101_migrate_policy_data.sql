/*
  # Consolidate Site Policies - Step 2: Data Migration
  
  This migration:
  1. Merges existing role-specific content into unified records
  2. Deactivates old role-specific contracts
  
  IMPORTANT: This must be run AFTER Step 1 has been executed and committed.
*/

-- 1. Insert unified Terms & Conditions
-- We concatenate Customer + Vendor terms/privacy with fallback messages if some are missing.
INSERT INTO contracts (contract_type, title, content, version, is_active, created_at)
SELECT 
  'terms_and_conditions'::contract_type,
  'Terms & Conditions',
  (
    '# Unified Terms & Conditions' || E'\n\n' ||
    '---' || E'\n\n' ||
    COALESCE((SELECT content FROM contracts WHERE contract_type = 'customer_terms' AND is_active = true LIMIT 1), 'Customer terms not found.') || E'\n\n' ||
    '---' || E'\n\n' ||
    COALESCE((SELECT content FROM contracts WHERE contract_type = 'vendor_terms' AND is_active = true LIMIT 1), 'Vendor terms not found.')
  ),
  '1.0',
  true,
  now()
WHERE EXISTS (SELECT 1 FROM contracts WHERE contract_type IN ('customer_terms', 'vendor_terms'))
AND NOT EXISTS (SELECT 1 FROM contracts WHERE contract_type = 'terms_and_conditions');

-- 2. Insert unified Privacy Policy
INSERT INTO contracts (contract_type, title, content, version, is_active, created_at)
SELECT 
  'privacy_policy'::contract_type,
  'Privacy Policy',
  (
    '# Unified Privacy Policy' || E'\n\n' ||
    '---' || E'\n\n' ||
    COALESCE((SELECT content FROM contracts WHERE contract_type = 'customer_privacy' AND is_active = true LIMIT 1), 'Customer privacy not found.') || E'\n\n' ||
    '---' || E'\n\n' ||
    COALESCE((SELECT content FROM contracts WHERE contract_type = 'vendor_privacy' AND is_active = true LIMIT 1), 'Vendor privacy not found.')
  ),
  '1.0',
  true,
  now()
WHERE EXISTS (SELECT 1 FROM contracts WHERE contract_type IN ('customer_privacy', 'vendor_privacy'))
AND NOT EXISTS (SELECT 1 FROM contracts WHERE contract_type = 'privacy_policy');

-- 3. Deactivate old role-specific contracts
UPDATE contracts 
SET is_active = false 
WHERE contract_type IN ('customer_terms', 'vendor_terms', 'logistic_terms', 'customer_privacy', 'vendor_privacy', 'logistic_privacy')
AND is_active = true;
