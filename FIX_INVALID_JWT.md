# ✅ Fixed: Invalid JWT Error (401 Unauthorized)

## Problem
When trying to process payments, you were getting:
```json
{
  "code": 401,
  "message": "Invalid JWT"
}
```

## Root Cause
The edge function was using the **SERVICE_ROLE_KEY** to verify user JWT tokens, which doesn't work. The SERVICE_ROLE_KEY is meant for admin operations that bypass Row Level Security (RLS), NOT for verifying user authentication tokens.

## Solution Applied

### 1. Updated Edge Function (`supabase/functions/process-payment/index.ts`)

**BEFORE:**
```typescript
const supabase = createClient(supabaseUrl, supabaseKey);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```

**AFTER:**
```typescript
// Use anon key for JWT verification
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
// Use service role for database operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
```

### 2. Added Better Error Handling
Now the edge function properly checks if the Authorization header is present:
```typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(
    JSON.stringify({ code: 401, message: 'Missing authorization header' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### 3. Deployed the Updated Function
```bash
npx supabase functions deploy process-payment
```

## How It Works Now

1. **Mobile App** sends payment request with user's JWT token in Authorization header
2. **Edge Function** uses `SUPABASE_ANON_KEY` client to verify the JWT token
3. Once verified, it uses `SERVICE_ROLE_KEY` client for database operations (to bypass RLS when needed)
4. Payment is processed successfully

## Test the Fix

1. **Open your mobile app** at `http://localhost:5174/checkout`
2. **Select a payment method** (iVeri Card or EcoCash)
3. **Fill in the required details**
4. **Click "Place Order"**

You should now see the payment processing successfully instead of the 401 error!

## Environment Variables Required

Make sure your Supabase project has these environment variables set:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key (for JWT verification)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for database operations)

These are automatically available in Supabase Edge Functions, so no manual configuration needed!

## If Still Having Issues

1. **Check Browser Console** - Look for any error messages
2. **Check Supabase Dashboard** - Go to Edge Functions → Logs to see detailed logs
3. **Verify Token** - Make sure the user is logged in and has a valid session

## Related Files
- `supabase/functions/process-payment/index.ts` - Edge function (UPDATED)
- `mobile/services/paymentService.ts` - Mobile payment service
- `mobile/app/checkout.tsx` - Checkout screen
