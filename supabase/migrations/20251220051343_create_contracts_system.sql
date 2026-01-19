/*
  # Create Contracts Management System

  1. New Tables
    - `contracts`
      - `id` (uuid, primary key)
      - `contract_type` (enum: 'vendor_terms', 'vendor_privacy', 'customer_terms', 'customer_privacy')
      - `title` (text)
      - `content` (text, full contract content)
      - `version` (text, version number)
      - `is_active` (boolean, whether this version is currently active)
      - `effective_date` (timestamptz, when this version becomes effective)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contract_acceptances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `contract_id` (uuid, references contracts)
      - `accepted_at` (timestamptz)
      - `ip_address` (text, for audit trail)
      - `user_agent` (text, for audit trail)

  2. Security
    - Enable RLS on both tables
    - Admins can manage contracts
    - Users can view active contracts
    - Users can accept contracts and view their own acceptances
*/

-- Create contract type enum
CREATE TYPE contract_type AS ENUM (
  'vendor_terms',
  'vendor_privacy',
  'customer_terms',
  'customer_privacy'
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type contract_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  is_active boolean DEFAULT false,
  effective_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contract acceptances table
CREATE TABLE IF NOT EXISTS contract_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  accepted_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  UNIQUE(user_id, contract_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_type_active ON contracts(contract_type, is_active);
CREATE INDEX IF NOT EXISTS idx_contracts_effective_date ON contracts(effective_date);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_user ON contract_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_acceptances_contract ON contract_acceptances(contract_id);

-- Enable RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;

-- Contracts policies
CREATE POLICY "Anyone can view active contracts"
  ON contracts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage contracts"
  ON contracts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Contract acceptances policies
CREATE POLICY "Users can view their own acceptances"
  ON contract_acceptances FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own acceptances"
  ON contract_acceptances FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all acceptances"
  ON contract_acceptances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contracts
DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contracts_updated_at();

-- Insert default contracts
INSERT INTO contracts (contract_type, title, content, version, is_active, created_at) VALUES
(
  'vendor_terms',
  'Vendor Terms and Conditions',
  E'# Vendor Terms and Conditions\n\n## 1. Introduction\nWelcome to our marketplace platform. These terms and conditions govern your use of our platform as a vendor.\n\n## 2. Vendor Registration\n2.1. You must provide accurate and complete information during registration.\n2.2. You are responsible for maintaining the confidentiality of your account credentials.\n\n## 3. Product Listings\n3.1. You are solely responsible for the accuracy of product descriptions, pricing, and availability.\n3.2. Products must comply with all applicable laws and regulations.\n3.3. Prohibited items include counterfeit goods, illegal substances, and any items that violate intellectual property rights.\n\n## 4. Pricing and Fees\n4.1. Commission rates are specified in your vendor package agreement.\n4.2. Fees are deducted automatically from each transaction.\n4.3. You are responsible for all applicable taxes on your sales.\n\n## 5. Order Fulfillment\n5.1. You must fulfill orders promptly according to the stated delivery timeframe.\n5.2. You are responsible for packaging and shipping products securely.\n5.3. Tracking information must be provided for all shipments.\n\n## 6. Customer Service\n6.1. You must respond to customer inquiries within 24 hours.\n6.2. You are responsible for handling returns and exchanges according to your stated policy.\n\n## 7. Payment Terms\n7.1. Payments are processed according to the payment schedule in your vendor agreement.\n7.2. Refunds and chargebacks may be deducted from your account balance.\n\n## 8. Intellectual Property\n8.1. You retain ownership of your product listings and content.\n8.2. You grant us a license to display and promote your products on our platform.\n\n## 9. Termination\n9.1. Either party may terminate this agreement with written notice.\n9.2. We may suspend or terminate your account for violations of these terms.\n\n## 10. Limitation of Liability\nOur liability is limited to the maximum extent permitted by law.\n\n## 11. Changes to Terms\nWe reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.\n\n## 12. Contact\nFor questions about these terms, please contact our support team.',
  '1.0',
  true,
  now()
),
(
  'vendor_privacy',
  'Vendor Privacy Policy',
  E'# Vendor Privacy Policy\n\n## 1. Information We Collect\n\n### 1.1 Account Information\n- Business name and registration details\n- Contact information (email, phone, address)\n- Banking and payment information\n- Tax identification numbers\n\n### 1.2 Business Information\n- Product listings and inventory data\n- Sales and transaction history\n- Customer interaction records\n- Performance metrics and analytics\n\n### 1.3 Technical Information\n- IP addresses and device information\n- Browser type and version\n- Usage data and activity logs\n\n## 2. How We Use Your Information\n\n### 2.1 Platform Operations\n- Process transactions and payments\n- Manage your vendor account\n- Provide customer support\n- Detect and prevent fraud\n\n### 2.2 Business Analytics\n- Generate sales reports and insights\n- Improve platform functionality\n- Optimize user experience\n\n### 2.3 Communication\n- Send transaction notifications\n- Provide platform updates\n- Share marketing opportunities (with consent)\n\n## 3. Information Sharing\n\n### 3.1 We Share Information With:\n- Customers (product listings, business name, ratings)\n- Payment processors (for transaction processing)\n- Shipping carriers (for order fulfillment)\n- Legal authorities (when required by law)\n\n### 3.2 We Do Not:\n- Sell your personal information to third parties\n- Share banking details with unauthorized parties\n- Disclose confidential business information\n\n## 4. Data Security\n- Encryption of sensitive data\n- Regular security audits\n- Secure payment processing\n- Access controls and authentication\n\n## 5. Data Retention\n- Account data retained while account is active\n- Transaction records kept for legal and tax purposes\n- Inactive accounts may be deleted after notification\n\n## 6. Your Rights\n- Access your personal information\n- Correct inaccurate data\n- Request data deletion (subject to legal requirements)\n- Export your data\n- Opt-out of marketing communications\n\n## 7. Cookies and Tracking\n- Essential cookies for platform functionality\n- Analytics cookies for performance monitoring\n- You can control cookie preferences in your browser\n\n## 8. International Transfers\nYour data may be processed in different countries where our servers are located.\n\n## 9. Updates to Privacy Policy\nWe will notify you of significant changes to this policy.\n\n## 10. Contact Information\nFor privacy concerns, contact our Data Protection Officer.',
  '1.0',
  true,
  now()
),
(
  'customer_terms',
  'Customer Terms and Conditions',
  E'# Customer Terms and Conditions\n\n## 1. Introduction\nWelcome to our marketplace. These terms govern your use of our platform as a customer.\n\n## 2. Account Registration\n2.1. You must be at least 18 years old to create an account.\n2.2. Provide accurate and complete registration information.\n2.3. Keep your account credentials confidential.\n2.4. You are responsible for all activities under your account.\n\n## 3. Product Purchases\n\n### 3.1 Order Process\n- Browse products from various vendors\n- Add items to your shopping cart\n- Complete checkout with payment information\n- Receive order confirmation\n\n### 3.2 Product Information\n- Product descriptions are provided by vendors\n- Prices are set by individual vendors\n- Availability is subject to vendor inventory\n\n### 3.3 Pricing\n- All prices are displayed in the selected currency\n- Prices include applicable taxes unless otherwise stated\n- Shipping costs are calculated at checkout\n\n## 4. Payment\n\n### 4.1 Payment Methods\n- We accept major credit cards and debit cards\n- Payment is processed securely through our payment gateway\n- Payment must be completed before order processing\n\n### 4.2 Payment Authorization\n- By placing an order, you authorize payment\n- Funds are charged when order is confirmed\n- Failed payments will cancel the order\n\n## 5. Shipping and Delivery\n\n### 5.1 Shipping\n- Shipping is handled by individual vendors\n- Delivery times vary by vendor and location\n- Tracking information will be provided when available\n\n### 5.2 Delivery Issues\n- Contact the vendor for delivery concerns\n- Report non-delivery within specified timeframe\n- Platform support available for unresolved issues\n\n## 6. Returns and Refunds\n\n### 6.1 Return Policy\n- Each vendor sets their own return policy\n- Review vendor return policy before purchase\n- Return requests must follow vendor guidelines\n\n### 6.2 Refunds\n- Refunds processed according to vendor policy\n- Refunds issued to original payment method\n- Processing time varies by payment provider\n\n## 7. User Conduct\n\n### 7.1 You Agree Not To:\n- Violate any laws or regulations\n- Infringe on intellectual property rights\n- Post false or misleading reviews\n- Engage in fraudulent activities\n- Harass vendors or other users\n\n### 7.2 Consequences\n- Account suspension or termination for violations\n- Legal action for serious breaches\n\n## 8. Reviews and Ratings\n\n### 8.1 Review Guidelines\n- Reviews must be based on genuine experience\n- Provide honest and constructive feedback\n- No offensive or inappropriate content\n- No promotional content or spam\n\n### 8.2 Review Rights\n- We reserve the right to remove inappropriate reviews\n- Vendors may respond to reviews\n\n## 9. Intellectual Property\n- Platform content is protected by copyright\n- User-generated content remains your property\n- You grant us license to display your content\n\n## 10. Privacy\nYour use of the platform is subject to our Privacy Policy.\n\n## 11. Limitation of Liability\n\n### 11.1 Platform Role\n- We act as an intermediary between customers and vendors\n- Vendors are responsible for their products and services\n- We are not liable for vendor actions or product defects\n\n### 11.2 Liability Limits\n- Liability limited to amount paid for the specific transaction\n- No liability for indirect or consequential damages\n\n## 12. Dispute Resolution\n\n### 12.1 Customer-Vendor Disputes\n- Attempt to resolve directly with vendor first\n- Contact platform support if resolution unsuccessful\n- Mediation services available for serious disputes\n\n### 12.2 Platform Disputes\n- Governed by laws of our jurisdiction\n- Arbitration clause may apply\n\n## 13. Termination\n- You may close your account at any time\n- We may suspend or terminate accounts for violations\n- Outstanding orders must be completed before account closure\n\n## 14. Changes to Terms\n- We may update these terms periodically\n- Continued use constitutes acceptance of changes\n- Significant changes will be notified via email\n\n## 15. Contact\nFor questions or concerns, contact our customer support team.',
  '1.0',
  true,
  now()
),
(
  'customer_privacy',
  'Customer Privacy Policy',
  E'# Customer Privacy Policy\n\n## 1. Introduction\nWe respect your privacy and are committed to protecting your personal information.\n\n## 2. Information We Collect\n\n### 2.1 Account Information\n- Name and contact details\n- Email address and phone number\n- Shipping and billing addresses\n- Account credentials\n\n### 2.2 Purchase Information\n- Order history and details\n- Payment information (processed securely)\n- Shipping preferences\n- Product reviews and ratings\n\n### 2.3 Technical Information\n- IP address and device type\n- Browser information\n- Cookies and similar technologies\n- Usage patterns and preferences\n\n### 2.4 Communication Data\n- Customer support interactions\n- Emails and messages\n- Survey responses and feedback\n\n## 3. How We Use Your Information\n\n### 3.1 Order Processing\n- Process and fulfill your orders\n- Communicate order status and updates\n- Handle returns and refunds\n- Provide customer support\n\n### 3.2 Account Management\n- Create and maintain your account\n- Authenticate your identity\n- Send account-related notifications\n\n### 3.3 Platform Improvement\n- Analyze usage patterns\n- Improve user experience\n- Develop new features\n- Personalize your shopping experience\n\n### 3.4 Marketing (With Consent)\n- Send promotional emails\n- Recommend products\n- Share special offers and discounts\n- You can opt-out at any time\n\n### 3.5 Legal Compliance\n- Comply with legal obligations\n- Prevent fraud and abuse\n- Enforce terms and conditions\n- Protect rights and safety\n\n## 4. Information Sharing\n\n### 4.1 We Share Your Information With:\n\n#### Vendors\n- Name and shipping address (for order fulfillment)\n- Order details\n- Contact information (for order-related communication)\n\n#### Service Providers\n- Payment processors (for transaction processing)\n- Shipping companies (for delivery)\n- Cloud storage providers\n- Analytics services\n- Customer support tools\n\n#### Legal Requirements\n- Law enforcement (when legally required)\n- Court orders and legal processes\n- Protection of rights and safety\n\n### 4.2 We Do Not:\n- Sell your personal information\n- Share payment card details with vendors\n- Disclose information for marketing purposes without consent\n\n## 5. Data Security\n\n### 5.1 Security Measures\n- Encryption of sensitive data (SSL/TLS)\n- Secure payment processing (PCI DSS compliant)\n- Regular security assessments\n- Access controls and authentication\n- Employee training on data protection\n\n### 5.2 Your Responsibility\n- Keep password secure and confidential\n- Use strong, unique passwords\n- Log out after using shared devices\n- Report suspicious activity immediately\n\n## 6. Data Retention\n\n### 6.1 Retention Periods\n- Account data: While account is active\n- Order history: 7 years (for legal and tax purposes)\n- Payment information: Not stored (handled by payment processor)\n- Marketing data: Until you opt-out\n\n### 6.2 Account Deletion\n- Request account deletion anytime\n- Some data retained for legal compliance\n- Anonymized data may be kept for analytics\n\n## 7. Your Rights\n\n### 7.1 You Have the Right To:\n- Access your personal information\n- Correct inaccurate data\n- Request data deletion\n- Export your data\n- Withdraw consent\n- Object to processing\n- Lodge a complaint with authorities\n\n### 7.2 Exercising Your Rights\n- Contact our privacy team\n- Use account settings for basic controls\n- Response within 30 days\n\n## 8. Cookies and Tracking\n\n### 8.1 Cookie Types\n- Essential cookies (required for platform operation)\n- Analytics cookies (usage statistics)\n- Preference cookies (your settings)\n- Marketing cookies (personalized ads - with consent)\n\n### 8.2 Cookie Control\n- Manage preferences in cookie settings\n- Browser settings can block cookies\n- Some features may not work without essential cookies\n\n## 9. Third-Party Links\n- Our platform may contain links to external websites\n- We are not responsible for their privacy practices\n- Review their privacy policies before providing information\n\n## 10. Children\'s Privacy\n- Platform not intended for users under 18\n- No knowing collection of children\'s information\n- Contact us if you believe we have children\'s data\n\n## 11. International Data Transfers\n- Data may be processed in different countries\n- Adequate safeguards in place for transfers\n- Compliance with applicable data protection laws\n\n## 12. Changes to Privacy Policy\n\n### 12.1 Policy Updates\n- We may update this policy periodically\n- Notification of significant changes via email\n- Continued use indicates acceptance\n- Previous versions available upon request\n\n## 13. Contact Us\n\n### 13.1 Privacy Inquiries\n- Email: privacy@marketplace.com\n- Data Protection Officer contact\n- Response time: 5-7 business days\n\n### 13.2 Support Channels\n- Help Center\n- Live Chat (for urgent concerns)\n- Phone support\n\n## 14. Consent\nBy using our platform, you consent to this privacy policy.',
  '1.0',
  true,
  now()
);
