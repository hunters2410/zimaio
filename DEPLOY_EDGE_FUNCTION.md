# 🚀 Deploy iVeri Edge Function - REQUIRED STEP

## Problem

You're getting a 401 error when trying to make a payment because the **Supabase Edge Function is not deployed** or not working correctly.

---

## ✅ SOLUTION: Deploy the Edge Function

### **Step 1: Login to Supabase CLI**

```bash
npx supabase login
```

This will open your browser. Log in with your Supabase account.

---

### **Step 2: Link to Your Project**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

**To find your PROJECT_REF:**
- Look at your Supabase URL: `https://mnkncdqalkamhmtfcykm.supabase.co`
- The project ref is: `mnkncdqalkamhmtfcykm` (the part before `.supabase.co`)

So run:
```bash
npx supabase link --project-ref mnkncdqalkamhmtfcykm
```

---

### **Step 3: Deploy the Edge Function**

```bash
npx supabase functions deploy process-payment
```

You should see output like:
```
Deploying process-payment function...
✓ Function deployed successfully
```

---

### **Step 4: Verify Deployment**

```bash
npx supabase functions list
```

You should see `process-payment` in the list.

---

## 🧪 Test After Deployment

1. Refresh your browser (`http://localhost:5173`)
2. Try to make a payment
3. Check the browser console

You should now see detailed logs instead of the 401 error!

---

## ⚠️ If Deployment Fails

### Error: "Not logged in"

**Fix:**
```bash
npx supabase login
```

### Error: "Project not found"

**Fix:** Check your project ref and try linking again:
```bash
npx supabase link --project-ref YOUR_CORRECT_PROJECT_REF
```

### Error: "Permission denied"

**Fix:** Make sure you're the owner of the Supabase project or have admin access.

---

## 📋 Quick Commands Summary

```bash
# 1. Login
npx supabase login

# 2. Link project (use your actual project ref)
npx supabase link --project-ref mnkncdqalkamhmtfcykm

# 3. Deploy function
npx supabase functions deploy process-payment

# 4. Verify
npx supabase functions list
```

---

## ✅ What to Expect After Deployment

When you make a payment, instead of:
```
❌ {"code":401,"message":"Missing authorization header"}
```

You should see:
```
🔐 Initiating payment - checking authentication...
✅ Session valid
📤 Sending payment request...
📥 Response received:
   Status: 200 OK
✅ Payment API call successful
```

---

## 🆘 Still Having Issues?

Share the **exact error message** from:
1. The deployment command output
2. The browser console when trying to pay
3. The Supabase Dashboard → Edge Functions → Logs
