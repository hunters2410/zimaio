# Payment Gateway Setup Guide

## Current Status
Based on the default migration, only **Cash on Delivery** is active. All other payment gateways need to be configured and activated manually.

## Available Payment Gateways

### 1. ✅ Cash on Delivery (ACTIVE by default)
- **Status**: Ready to use
- **No configuration needed**

### 2. ❌ PayNow Zimbabwe (INACTIVE - needs configuration)
- **For**: Mobile money (Ecocash, OneMoney) and bank cards
- **Setup Steps**:
  1. Sign up at https://www.paynow.co.zw
  2. Get Integration ID and Integration Key from merchant dashboard
  3. Run this SQL in Supabase:
  ```sql
  UPDATE payment_gateways 
  SET 
    is_active = true,
    configuration = jsonb_set(
      jsonb_set(configuration, '{integration_id}', '"YOUR_INTEGRATION_ID"'),
      '{integration_key}', '"YOUR_INTEGRATION_KEY"'
    )
  WHERE gateway_name = 'paynow';
  ```

### 3. ❌ PayPal (INACTIVE - needs configuration)
- **For**: International payments
- **Setup Steps**:
  1. Create PayPal Business account at https://www.paypal.com/business
  2. Go to Developer Dashboard at https://developer.paypal.com
  3. Create REST API app under "My Apps & Credentials"
  4. Copy Client ID and Secret
  5. Run this SQL in Supabase:
  ```sql
  UPDATE payment_gateways 
  SET 
    is_active = true,
    configuration = jsonb_set(
      jsonb_set(
        jsonb_set(configuration, '{client_id}', '"YOUR_CLIENT_ID"'),
        '{client_secret}', '"YOUR_CLIENT_SECRET"'
      ),
      '{mode}', '"sandbox"'  -- Change to "live" for production
    )
  WHERE gateway_name = 'paypal';
  ```

### 4. ❌ Stripe (INACTIVE - needs configuration)
- **For**: Credit cards and digital wallets
- **Setup Steps**:
  1. Sign up at https://stripe.com
  2. Complete account verification
  3. Go to Developers > API keys
  4. Copy Publishable and Secret keys
  5. Run this SQL in Supabase:
  ```sql
  UPDATE payment_gateways 
  SET 
    is_active = true,
    configuration = jsonb_set(
      jsonb_set(configuration, '{publishable_key}', '"YOUR_PUBLISHABLE_KEY"'),
      '{secret_key}', '"YOUR_SECRET_KEY"'
    )
  WHERE gateway_name = 'stripe';
  ```

### 5. ✅ iVeri Enterprise (if already configured)
- **For**: Card payments and EcoCash in Zimbabwe
- **Check if active**: Run this SQL to see status:
  ```sql
  SELECT gateway_name, display_name, is_active 
  FROM payment_gateways 
  WHERE gateway_type = 'iveri';
  ```

## Quick Fix for Checkout

**Run this SQL script immediately to ensure customers can see payment options:**

```sql
-- File: FIX_PAYMENT_GATEWAY_ACCESS.sql

-- Enable RLS on payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public view active gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Anyone can view active gateways" ON public.payment_gateways;

-- Allow EVERYONE (authenticated AND anonymous) to view active gateways
CREATE POLICY "Anyone can view active gateways" 
ON public.payment_gateways 
FOR SELECT 
USING (is_active = true);

NOTIFY pgrst, 'reload schema';
```

## Testing Payment Gateways

1. **Cash on Delivery**: Should work immediately (no external API required)
2. **iVeri/PayNow/PayPal/Stripe**: Requires valid API credentials and active status

## Common Issues

### "Payment gateways not showing"
- **Cause**: RLS policy blocking access
- **Fix**: Run `FIX_PAYMENT_GATEWAY_ACCESS.sql`

### "Gateway shows but payment fails"
- **Cause**: Gateway is active but API credentials are missing/invalid
- **Fix**: Check configuration in Supabase dashboard:
  ```sql
  SELECT gateway_name, is_active, configuration 
  FROM payment_gateways 
  WHERE is_active = true;
  ```

### "Unauthorized during checkout"
- **Cause**: RLS on orders/order_items blocking customer inserts
- **Fix**: Already resolved with previous SQL scripts

## Verify Current Active Gateways

Run this query in Supabase SQL Editor to see what's currently active:

```sql
SELECT 
  gateway_name,
  display_name,
  is_active,
  is_default,
  supported_currencies
FROM payment_gateways
ORDER BY sort_order;
```
