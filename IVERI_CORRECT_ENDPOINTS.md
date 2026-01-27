# ✅ iVeri Correct REST API Endpoints

## 🚨 Problem with Current URL

Your current URL is **INCORRECT**:
```
❌ https://portal.iveri.com/Enterprise/REST
```

This is why you're getting DNS errors - **this endpoint doesn't exist!**

---

## ✅ Correct iVeri REST Endpoints

According to the [official iVeri documentation](https://www.iveri.com/docs/enterprise-developer-guide-58#rest-endpoints-1398-3), the correct endpoints are:

### **Base URLs by Acquiring Bank:**

The endpoint depends on which acquiring bank you have your merchant agreement with:

1. **Nedbank (NedSecure):**
   ```
   https://portal.nedsecure.co.za/api/transactions
   ```

2. **CSC Acquiring:**
   ```
   https://portal.cscacquiring.com/api/transactions
   ```

3. **iVeri Direct / Generic:**
   ```
   https://portal.host.iveri.com/api/transactions
   ```

4. **CIM Mauritius:**
   ```
   https://portal.merchant.cim.mu/api/transactions
   ```

---

## 🔑 Correct Endpoint Path

For **ALL** acquiring banks, the path is:
```
/api/transactions
```

**NOT** `/Enterprise/REST` ❌

---

## 📝 Update Your Configuration

### Option 1: SQL Update (Recommended)

Run this in **Supabase Dashboard → SQL Editor**:

```sql
-- Update to iVeri Direct endpoint (most common)
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{api_url}',
  '"https://portal.host.iveri.com/api/transactions"'::jsonb
)
WHERE gateway_type = 'iveri';

-- Also ensure mode is set to Live (when ready for production)
-- UPDATE payment_gateways
-- SET configuration = jsonb_set(
--   configuration,
--   '{mode}',
--   '"Live"'::jsonb
-- )
-- WHERE gateway_type = 'iveri';
```

### Option 2: Check Which Bank You Use

If you're not sure which endpoint to use:

1. **Check your iVeri merchant agreement** - it will say which bank
2. **Contact iVeri support:** [assist@iveri.co.za](mailto:assist@iveri.co.za)
3. **Check your iVeri Backoffice URL:**
   - If it contains "nedsecure" → Use Nedbank endpoint
   - If it contains "cscacquiring" → Use CSC endpoint
   - Otherwise → Use `portal.host.iveri.com`

---

## 🔧 Update Edge Function (Already Done!)

Your edge function at `supabase/functions/process-payment/index.ts` already supports custom URLs:

```typescript
const apiUrl = config.api_url || "https://portal.iveri.com/Enterprise/REST";
```

The `config.api_url` will be read from the database, so just update it via SQL above!

---

## 📋 Complete Configuration Example

Here's what your iVeri payment gateway configuration should look like:

```json
{
  "certificate_id": "{your-certificate-id}",
  "application_id": "your-application-id",
  "api_url": "https://portal.host.iveri.com/api/transactions",
  "mode": "Test"
}
```

**For Zimbabwe merchants**, you likely use:
```
https://portal.host.iveri.com/api/transactions
```

---

## 🧪 Testing Steps

### Step 1: Keep Test Mode Enabled (For Now)
```sql
-- Keep this until you verify the endpoint works
SELECT configuration->>'mode' as mode,
       configuration->>'api_url' as api_url
FROM payment_gateways
WHERE gateway_type = 'iveri';
```

Should show:
- `mode: "Test"`
- `api_url: "https://portal.host.iveri.com/api/transactions"` (or your bank's URL)

### Step 2: When Ready, Switch to Live Mode

Once you:
1. ✅ Have valid iVeri credentials (Application ID, Certificate ID)
2. ✅ Confirmed the correct endpoint for your bank
3. ✅ Tested in Test Mode successfully

Then update:
```sql
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{mode}',
  '"Live"'::jsonb
)
WHERE gateway_type = 'iveri';
```

And redeploy:
```bash
npx supabase functions deploy process-payment --no-verify-jwt
```

---

## 🌍 For Zimbabwe Users

If you're in Zimbabwe, you're most likely using the **iVeri Direct** endpoint:

```
https://portal.host.iveri.com/api/transactions
```

**To verify:**
1. Check your iVeri Backoffice login URL
2. Contact iVeri support in Zimbabwe
3. Check your merchant agreement

---

## ⚙️ API Specifications

According to iVeri docs:

**Method:** POST  
**Format:** JSON  
**Content-Type:** application/json  
**Endpoint:** `/api/transactions`

**Request Body Example:**
```json
{
  "Version": "2.0",
  "CertificateID": "{your-certificate-id}",
  "ProductType": "Enterprise",
  "ProductVersion": "WebAPI",
  "Direction": "Request",
  "Transaction": {
    "ApplicationID": "your-app-id",
    "Command": "Debit",
    "Mode": "Test",
    "MerchantReference": "ORD-12345",
    "Currency": "USD",
    "Amount": "1000",
    "ExpiryDate": "1228",
    "PAN": "4111111111111111",
    "CVV": "123"
  }
}
```

---

## 📞 Need Help?

**iVeri Support:**
- Email: [assist@iveri.co.za](mailto:assist@iveri.co.za)
- Ask them:
  1. "Which REST endpoint should I use for my merchant account?"
  2. "What is my Application ID?"
  3. "Can you confirm my Certificate ID?"

---

## 🎯 Quick Fix Summary

1. **Update API URL in database:**
   ```sql
   UPDATE payment_gateways
   SET configuration = jsonb_set(
     configuration,
     '{api_url}',
     '"https://portal.host.iveri.com/api/transactions"'::jsonb
   )
   WHERE gateway_type = 'iveri';
   ```

2. **Verify configuration:**
   ```sql
   SELECT configuration FROM payment_gateways WHERE gateway_type = 'iveri';
   ```

3. **Keep Test Mode enabled** until you verify everything works with real credentials

4. **No need to redeploy** - the edge function reads from the database!

---

## 📚 References

- [iVeri Enterprise Developer Guide](https://www.iveri.com/docs/enterprise-developer-guide-58)
- [REST Endpoints Documentation](https://www.iveri.com/docs/enterprise-developer-guide-58#rest-endpoints-1398-3)
- [iVeri Backoffice Guide](https://www.iveri.com/docs/enterprise-backoffice-user-guide-5)
