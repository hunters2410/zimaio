/*
  # Insert Payment Gateways
  
  Ensures that all payment gateways (PayNow, PayPal, Stripe, Cash) are available in the system.
  
  1. Tables Updated
    - `payment_gateways` - Inserts PayNow, PayPal, Stripe, and Cash gateways
  
  2. Payment Gateways Added
    - **PayNow Zimbabwe** - Mobile money and card payments for Zimbabwe
    - **PayPal** - International payment processing
    - **Stripe** - Credit card and digital wallet payments
    - **Cash on Delivery** - Cash payment on delivery
  
  3. Configuration Details
    - Each gateway has empty configuration fields ready for admin to fill
    - Instructions provided for obtaining API credentials
    - Supported currencies defined for each gateway
    - Sort order set for display priority
  
  4. Important Notes
    - All gateways except Cash are inactive by default
    - Admin must configure API credentials before activating
    - Checks for existing gateways to prevent duplicates
*/

-- Insert PayNow if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paynow') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'paynow',
      'paynow',
      'PayNow Zimbabwe',
      'Fast and secure payments in Zimbabwe using mobile money (Ecocash, OneMoney) and bank cards',
      false,
      false,
      '{"integration_id": "", "integration_key": "", "return_url": "", "result_url": ""}'::jsonb,
      'To activate PayNow: 1. Sign up at https://www.paynow.co.zw 2. Get your Integration ID and Integration Key from your merchant dashboard 3. Enter these credentials in the configuration below 4. Configure your return_url and result_url for payment notifications 5. Test with a small transaction before going live',
      1,
      ARRAY['USD', 'ZWL']
    );
  END IF;
END $$;

-- Insert PayPal if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'paypal') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'paypal',
      'paypal',
      'PayPal',
      'Accept payments worldwide with PayPal',
      false,
      false,
      '{"client_id": "", "client_secret": "", "mode": "sandbox"}'::jsonb,
      'To activate PayPal: 1. Create a PayPal Business account at https://www.paypal.com/business 2. Go to Developer Dashboard at https://developer.paypal.com 3. Create a REST API app under "My Apps & Credentials" 4. Copy the Client ID and Secret 5. Test in sandbox mode first, then switch to "live" for production',
      2,
      ARRAY['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY']
    );
  END IF;
END $$;

-- Insert Stripe if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'stripe') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'stripe',
      'stripe',
      'Stripe',
      'Accept credit cards and digital wallets globally',
      false,
      false,
      '{"publishable_key": "", "secret_key": ""}'::jsonb,
      'To activate Stripe: 1. Sign up at https://stripe.com 2. Complete account verification 3. Go to Developers > API keys 4. Copy your Publishable key and Secret key 5. Use test keys for testing, then switch to live keys for production',
      3,
      ARRAY['USD', 'EUR', 'GBP', 'ZAR', 'AUD', 'CAD']
    );
  END IF;
END $$;

-- Insert Cash on Delivery if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateways WHERE gateway_name = 'cash') THEN
    INSERT INTO payment_gateways (gateway_name, gateway_type, display_name, description, is_active, is_default, configuration, instructions, sort_order, supported_currencies)
    VALUES (
      'cash',
      'cash',
      'Cash on Delivery',
      'Pay with cash when your order is delivered',
      true,
      true,
      '{}'::jsonb,
      'Cash payment will be collected by the delivery person when your order arrives. Please have the exact amount ready as change may not always be available.',
      4,
      ARRAY['USD', 'ZWL']
    );
  END IF;
END $$;
