# 🔧 iVeri Payment Gateway - Troubleshooting Checklist

## ✅ Quick Diagnostic Steps

### 1. Open Browser Console
Press `F12` and go to the **Console** tab. Try to make a payment and look for these debug messages:

```
=== iVeri Card Payment Debug ===
Order ID: <uuid>
Amount: <number>
Currency: USD
Card (masked): 4000****0002
Expiry: 1225
```

If you see these messages, the frontend is working. Look for the response:

```
=== iVeri Response ===
{success: true, ...} or {success: false, error: "..."}
```

### 2. Common Error Messages

| Error Message | What It Means | Solution |
|---------------|---------------|----------|
| "User not authenticated" | No active session | ✅ Make sure user is logged in |
| "Payment gateway not available" | Gateway not configured | ✅ Run `configure_iveri_gateway.sql` |
| "iVeri Application ID missing" | Config incomplete | ✅ Add your `application_id` to gateway config |
| "Payment initiation failed" | Generic error | ✅ Check browser Network tab for detailed response |
| "Session expired" | Auth token expired | ✅ Refresh page and try again |

---

## 🔍 Step-by-Step Debugging

### Step 1: Verify User Authentication

```javascript
// Run this in browser console (F12)
const { data: { session } } = await window.__SUPABASE_CLIENT__.auth.getSession();
console.log('Authenticated:', !!session);
console.log('User ID:', session?.user?.id);
```

Expected: `Authenticated: true` with a valid user ID.

---

### Step 2: Check Payment Gateway Configuration

Go to your Supabase SQL Editor and run:

```sql
SELECT 
    gateway_type,
    is_active,
    configuration->>'application_id' as app_id,
    configuration->>'mode' as mode
FROM payment_gateways 
WHERE gateway_type = 'iveri';
```

Expected results:
- `is_active`: `true`
- `app_id`: Your actual iVeri Application ID (NOT "YOUR_IVERI_APP_ID_HERE")
- `mode`: "Test" or "Live"

❌ **If no results**: Gateway doesn't exist. Run `configure_iveri_gateway.sql`

❌ **If `app_id` is empty or placeholder**: Update it with your real iVeri credentials

---

### Step 3: Check Edge Function is Deployed

In terminal, run:

```bash
npx supabase functions list
```

You should see `process-payment` in the list.

❌ **If not listed**: Deploy it:

```bash
npx supabase functions deploy process-payment
```

---

### Step 4: Test Payment API Directly

Get your auth token:

```javascript
// In browser console
const { data: { session } } = await window.__SUPABASE_CLIENT__.auth.getSession();
console.log('Token:', session?.access_token);
```

Then test the API with curl:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-payment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "test-order-id",
    "gateway_type": "iveri",
    "amount": 1.00,
    "currency": "USD",
    "metadata": {
      "payment_subtype": "card",
      "card_pan": "4000000000000002",
      "card_expiry": "1225",
      "card_cvv": "123"
    }
  }'
```

Expected response:
```json
{"success": true, "transaction_id": "...", "message": "Payment Approved"}
```

---

### Step 5: Check Network Tab

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to make a payment
4. Look for a request to `/functions/v1/process-payment`
5. Click on it and check:
   - **Request Headers**: Should have `Authorization: Bearer ...`
   - **Request Payload**: Should contain order_id, amount, metadata with card details
   - **Response**: Check status code and response body

Common issues:
- ❌ 401 Unauthorized → User not logged in
- ❌ 404 Not Found → Edge function not deployed
- ❌ 500 Internal Server Error → Check Supabase function logs
- ❌ 400 Bad Request → Check response body for error message

---

## 🛠️ Configuration Fixes

### Fix 1: Gateway Not Configured

Run this in Supabase SQL Editor (replace YOUR_APP_ID):

```sql
UPDATE payment_gateways 
SET 
    is_active = true,
    configuration = jsonb_build_object(
        'application_id', 'YOUR_IVERI_APP_ID',
        'certificate_id', '{4c96973f-71dd-4044-802d-6e234effe8f2}',
        'mode', 'Test',
        'api_url', 'https://portal.iveri.com/Enterprise/REST'
    )
WHERE gateway_type = 'iveri';
```

### Fix 2: Edge Function Not Deployed

```bash
cd "c:\Users\Acer P16\Documents\ZimAIo\zimaio"
npx supabase login
npx supabase functions deploy process-payment
```

### Fix 3: RLS Policy Issues

If you get "Permission denied" errors:

```sql
-- Allow authenticated users to create orders
CREATE POLICY "Users can create their own orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Allow authenticated users to create payment transactions
CREATE POLICY "Users can create their own transactions"
ON payment_transactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
```

---

## 📋 Pre-Flight Checklist

Before testing payment:

- [ ] User is logged in (check auth state)
- [ ] iVeri gateway exists in database
- [ ] Gateway `is_active = true`
- [ ] Gateway has valid `application_id`
- [ ] Edge function `process-payment` is deployed
- [ ] Cart has items
- [ ] Using test card: `4000000000000002`
- [ ] Expiry in MMYY format (e.g., `1225`)
- [ ] Browser console is open to see debug logs

---

## 🧪 Test Card Numbers

### For Test Mode (`mode: "Test"`):

| Card Number | Expected Result |
|-------------|-----------------|
| `4000000000000002` | ✅ Approved |
| `5100000000000008` | ❌ Declined |

**Format Requirements:**
- Card: 13-19 digits
- Expiry: MMYY (e.g., 1225 = Dec 2025)
- CVV: Any 3-4 digits (e.g., 123)

### For EcoCash:
- Phone: `0771234567` or `771234567`
- System creates PAN: `910012` + phone digits
- No CVV required

---

## 🆘 Still Not Working?

1. **Check Supabase Function Logs:**
   - Go to Supabase Dashboard
   - Navigate to Edge Functions
   - Click on `process-payment`
   - Check the Logs tab for errors

2. **Enable Verbose Logging:**
   - All payment requests now log to console
   - Check for "=== iVeri Card Payment Debug ===" messages
   - Look for detailed error messages

3. **Contact Support:**
   - Include the exact error message from browser console
   - Include the response from Network tab
   - Include your gateway configuration (hide sensitive data)

---

## 📝 Summary of Recent Changes

✅ Added detailed console logging for all iVeri payments
✅ Added input validation for card numbers and expiry dates
✅ Enhanced error messages with specific instructions
✅ Wrapped payment calls in try-catch for better error handling
✅ Created diagnostic SQL scripts
✅ Created this troubleshooting guide

Now try making a payment and check the **browser console** for detailed debug information!
