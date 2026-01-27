# ✅ How to Test That Endpoint URL is Being Used

## 🎉 **Update Complete!**

I just deployed the updated edge function that **logs the API URL** even in Test Mode!

---

## 🔍 **Step 1: Make a Test Payment**

1. Go to **http://localhost:5174/checkout**
2. Add items to cart (if not already there)
3. Fill in shipping details
4. Enter mock card details:
   - **Card:** `4111111111111111`
   - **Expiry:** `1228`
   - **CVV:** `123`
5. **Click "Place Order"**

---

## 📋 **Step 2: Check Edge Function Logs**

1. Open **Supabase Dashboard**
2. Go to **Edge Functions** → **process-payment**
3. Click **"Logs"** tab
4. Look for these lines:

```
[iVeri] Configured API URL: https://portal.host.iveri.com/api/transactions
[iVeri] Application ID: your-application-id
[iVeri] Certificate ID: {your-certificate-id}
[iVeri] TEST MODE ENABLED - Simulating payment approval
[iVeri] Note: API URL above would be used in Live mode
```

---

## ✅ **What You Should See:**

### **If Endpoint is CORRECT:**
```
[iVeri] Configured API URL: https://portal.host.iveri.com/api/transactions ✅
```

### **If Endpoint is STILL WRONG:**
```
[iVeri] Configured API URL: https://portal.iveri.com/Enterprise/REST ❌
```

If it's wrong, run the update SQL again:
```sql
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{api_url}',
  '"https://portal.host.iveri.com/api/transactions"'::jsonb
)
WHERE gateway_type = 'iveri';
```

---

## 🧪 **Alternative: Test With Real API (Advanced)**

If you have **valid iVeri credentials** and want to test the actual endpoint:

### Step 1: Disable Test Mode
```sql
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{mode}',
  '"Live"'::jsonb
)
WHERE gateway_type = 'iveri';
```

### Step 2: Make a Payment

Use **iVeri test cards** (ask iVeri support for test card numbers)

### Step 3: Check Logs

You'll see:
```
[iVeri] Configured API URL: https://portal.host.iveri.com/api/transactions
[iVeri] Application ID: ...
[iVeri] Initiating card payment. Mode: Live
[iVeri] URL: https://portal.host.iveri.com/api/transactions
```

Then you'll see either:
- ✅ Success response from iVeri
- ❌ Error (if credentials are invalid)

### Step 4: Re-enable Test Mode
```sql
UPDATE payment_gateways
SET configuration = jsonb_set(
  configuration,
  '{mode}',
  '"Test"'::jsonb
)
WHERE gateway_type = 'iveri';
```

---

## 📊 **Quick Verification Checklist**

- [ ] Updated endpoint in database (run SQL)
- [ ] Verified update with SELECT query
- [ ] Made test payment
- [ ] Checked edge function logs
- [ ] Confirmed correct URL in logs: `https://portal.host.iveri.com/api/transactions`

---

## 🎯 **Current Configuration Status:**

Run this to see your current config:
```sql
SELECT 
  gateway_type,
  configuration->>'api_url' as api_url,
  configuration->>'mode' as mode,
  configuration->>'application_id' as application_id,
  is_active
FROM payment_gateways
WHERE gateway_type = 'iveri';
```

**Expected Result:**
```
gateway_type: iveri
api_url: https://portal.host.iveri.com/api/transactions
mode: Test
application_id: your-app-id
is_active: true
```

---

## 💡 **What the Logs Tell You:**

The new logging shows:
1. **Configured API URL** - Confirms database config is correct
2. **Application ID** - Verifies your merchant ID
3. **Certificate ID** - Verifies your cert
4. **Mode** - Shows if Test or Live
5. **Note** - Reminds you that Test Mode bypasses the API

Even in Test Mode, you can now **verify** that the correct URL **would be used** in Live mode!

---

## 🚀 **Summary:**

1. ✅ **Edge function updated** - Now logs API URL in Test Mode
2. ✅ **Deployed successfully** - Changes are live
3. ✅ **Test it** - Make a payment and check logs
4. ✅ **Verify** - Confirm `https://portal.host.iveri.com/api/transactions` appears

**You can now verify the endpoint without switching to Live mode!** 🎉
