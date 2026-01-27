# iVeri Payment Gateway Debugging Guide

## Issue: "Payment initiation failed"

### Common Causes & Solutions

#### 1. Check Gateway Configuration in Database

Run this query in your Supabase SQL Editor:

```sql
SELECT * FROM payment_gateways WHERE gateway_type = 'iveri';
```

**Required Configuration Fields:**
- `application_id`: Your iVeri Application ID (REQUIRED)
- `certificate_id`: Certificate GUID (defaults to {4c96973f-71dd-4044-802d-6e234effe8f2})
- `mode`: "Test" or "Live"
- `api_url`: https://portal.iveri.com/Enterprise/REST (Enterprise API)
- `is_active`: true

**If gateway doesn't exist, create it:**

```sql
INSERT INTO payment_gateways (
  gateway_name,
  gateway_type,
  display_name,
  description,
  is_active,
  is_default,
  configuration,
  supported_currencies
) VALUES (
  'iVeri Payment Gateway',
  'iveri',
  'Credit/Debit Card',
  'Pay securely with your credit or debit card via iVeri',
  true,
  false,
  '{
    "application_id": "YOUR_IVERI_APP_ID_HERE",
    "certificate_id": "{4c96973f-71dd-4044-802d-6e234effe8f2}",
    "mode": "Test",
    "api_url": "https://portal.iveri.com/Enterprise/REST"
  }'::jsonb,
  ARRAY['USD', 'ZWL']
);
```

#### 2. Deploy the Edge Function

Make sure your Edge Function is deployed:

```bash
# Login to Supabase
npx supabase login

# Deploy the process-payment function
npx supabase functions deploy process-payment
```

#### 3. Check Browser Console

Open Developer Tools (F12) and check the Console and Network tabs:
- Look for any error messages
- Check the network request to `/functions/v1/process-payment`
- Look at the response body for detailed error messages

#### 4. Common Error Messages & Fixes

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "User not authenticated" | No valid session | User must be logged in before checkout |
| "Payment gateway not available" | Gateway not active or doesn't exist | Check database configuration |
| "iVeri Application ID missing" | Missing config | Add application_id to gateway config |
| "Payment initiation failed" | Generic error | Check browser console for details |
| "Order not found" | Order creation failed | Check RLS policies on orders table |

#### 5. Test Card Numbers (iVeri Test Mode)

For testing in "Test" mode, use these card numbers:

```
Successful Transaction: 4000000000000002
Declined Transaction: 5100000000000008
Card Number: 16 digits
Expiry: MMYY format (e.g., 1225 for Dec 2025)
CVV: Any 3-4 digits (e.g., 123)
```

#### 6. EcoCash Testing

For EcoCash:
- Phone format: 077XXXXXXX or 77XXXXXXX
- System creates PAN: 910012 + phone digits
- No CVV required
- Expiry auto-set to 1228

---

## Quick Diagnostic Steps

### Step 1: Check if user is authenticated
```javascript
// In browser console
const { data: { session } } = await window.__SUPABASE_CLIENT__.auth.getSession();
console.log('Session:', session);
```

### Step 2: Check active gateways
```javascript
// In browser console (if paymentService is exposed)
const gateways = await paymentService.getActiveGateways();
console.log('Active Gateways:', gateways);
```

### Step 3: Manual API Test

Test the Edge Function directly:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-payment \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "your-order-id",
    "gateway_type": "iveri",
    "amount": 10.00,
    "currency": "USD",
    "metadata": {
      "payment_subtype": "card",
      "card_pan": "4000000000000002",
      "card_expiry": "1225",
      "card_cvv": "123"
    }
  }'
```

---

## Deployment Checklist

- [ ] Gateway configured in database with correct `application_id`
- [ ] Edge function deployed to Supabase
- [ ] Environment variables set (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] User authenticated before checkout
- [ ] RLS policies allow order creation
- [ ] Test with valid test card numbers

---

## Next Steps

1. Run the SQL query above to check gateway configuration
2. Update `application_id` with your actual iVeri credentials
3. Deploy the Edge Function if not already deployed
4. Test with a test card number
5. Check browser console for detailed errors
