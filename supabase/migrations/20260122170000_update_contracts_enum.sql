-- Add Logistic contract types
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'logistic_terms';
ALTER TYPE contract_type ADD VALUE IF NOT EXISTS 'logistic_privacy';

-- Insert default Logistic contracts
INSERT INTO contracts (contract_type, title, content, version, is_active, created_at)
SELECT 'logistic_terms', 'Logistic Terms and Conditions', E'# Logistic Terms and Conditions\n\n## 1. Introduction\nThese terms govern your participation in our logistics network.\n\n## 2. Driver Responsibilities\nYou are responsible for timely and safe deliveries.\n\n## 3. Vehicle Requirements\nYour vehicle must be maintained and insured.\n\n## 4. Payment\nPayments are processed weekly based on completed deliveries.\n\n## 5. Termination\nWe may terminate this agreement for policy violations.', '1.0', true, now()
WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE contract_type = 'logistic_terms');

INSERT INTO contracts (contract_type, title, content, version, is_active, created_at)
SELECT 'logistic_privacy', 'Logistic Privacy Policy', E'# Logistic Privacy Policy\n\n## 1. Information Collection\nWe collect location data and driver details.\n\n## 2. Usage\nData is used to track deliveries and optimize routes.\n\n## 3. Sharing\nLocation is shared with customers during active deliveries.', '1.0', true, now()
WHERE NOT EXISTS (SELECT 1 FROM contracts WHERE contract_type = 'logistic_privacy');
