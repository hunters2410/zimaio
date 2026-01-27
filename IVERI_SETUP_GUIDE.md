# iVeri Payment Gateway Setup Guide

## Overview
iVeri is already integrated in your codebase! It supports:
- **Credit/Debit Card** payments
- **EcoCash** mobile money payments

## Current Integration Status

### Frontend Integration ✅
- **CheckoutPage**: Fully integrated with card and EcoCash options
- **Payment Service**: Configured to handle iVeri transactions
- **Payment Types**: Supports `iveri_card` and `iveri_ecocash`

### Backend Requirements ⚠️
You need a Supabase Edge Function to process iVeri payments. Based on the code, it expects:
- Function name: `process-payment`
- Location: `supabase/functions/process-payment/index.ts`

## Setup Steps

### 1. Check if iVeri Gateway Exists
Run **STEP 1** from `SETUP_IVERI_GATEWAY.sql`:
```sql
SELECT gateway_name, gateway_type, display_name, is_active, configuration
FROM payment_gateways 
WHERE gateway_type = 'iveri';
```

**Expected Results:**
- **If returns NO ROWS**: Gateway doesn't exist yet - proceed to Step 2
- **If returns data**: Gateway exists - skip to Step 3

### 2. Add iVeri Gateway (if needed)
Run **STEP 2** from `SETUP_IVERI_GATEWAY.sql` - this creates the gateway entry.

### 3. Configure iVeri Credentials ⚠️ REQUIRED!

You need to obtain these from iVeri:
- **Application ID**: Format `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}`
- **Certificate ID**: Format `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}`

Then run **STEP 3** from `SETUP_IVERI_GATEWAY.sql`, replacing the placeholder values.

### 4. Verify Configuration
Run **STEP 4** from `SETUP_IVERI_GATEWAY.sql` to confirm everything is set up correctly.

### 5. Create Supabase Edge Function

The frontend calls `/functions/v1/process-payment`. You need to create this function.

**Create file:** `supabase/functions/process-payment/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PaymentRequest {
  order_id: string
  gateway_type: string
  amount: number
  currency: string
  metadata?: {
    card_pan?: string
    card_expiry?: string
    card_cvv?: string
    payment_subtype?: 'card' | 'ecocash'
  }
}

serve(async (req) => {
  try {
    const { order_id, gateway_type, amount, currency, metadata } = await req.json() as PaymentRequest

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get iVeri gateway configuration
    const { data: gateway } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('gateway_type', 'iveri')
      .single()

    if (!gateway || !gateway.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'iVeri gateway not configured' }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const config = gateway.configuration
    
    // iVeri Enterprise REST API call
    const iveriPayload = {
      ApplicationId: config.application_id,
      CertificateId: config.certificate_id,
      Mode: config.mode || 'Test',
      TransactionIndex: order_id,
      Amount: (amount * 100).toString(), // Convert to cents
      Currency: currency,
      CardNumber: metadata?.card_pan || '',
      CardExpiryDate: metadata?.card_expiry || '',
      CardCVV: metadata?.card_cvv || '',
    }

    const iveriResponse = await fetch(config.api_url + '/DoTransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(iveriPayload),
    })

    const result = await iveriResponse.json()

    // Update payment transaction in database
    await supabase.from('payment_transactions').insert({
      order_id,
      gateway_id: gateway.id,
      gateway_type: 'iveri',
      amount,
      currency,
      status: result.Result === '0' ? 'completed' : 'failed',
      transaction_reference: result.TransactionIndex,
      metadata: { iveri_response: result },
    })

    // Update order if payment successful
    if (result.Result === '0') {
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'processing' })
        .eq('id', order_id)
    }

    return new Response(
      JSON.stringify({
        success: result.Result === '0',
        transaction_id: result.TransactionIndex,
        error: result.ResultDescription,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

**Note**: This is a basic template. You'll need to adjust it based on iVeri's actual API documentation.

### 6. Deploy the Edge Function

```bash
npx supabase functions deploy process-payment
```

### 7. Test the Integration

1. Go to checkout page on localhost:5173
2. Add an item to cart
3. Go to checkout
4. Select "In-Store Card" or "EcoCash"
5. Fill in payment details
6. Click "Pay & Place Order"

## How iVeri Integration Works

### For Card Payments (`iveri_card`):
1. Customer enters card details on checkout page
2. Frontend calls `/functions/v1/process-payment` with:
   - Card PAN (number)
   - Expiry date (MMYY)
   - CVV
3. Edge function calls iVeri Enterprise REST API
4. Response updates order and transaction status

### For EcoCash Payments (`iveri_ecocash`):
1. Customer enters mobile number
2. Frontend creates special PAN: `910012` + phone number
3. Sends to backend with expiry `1228` (required by iVeri)
4. iVeri processes as EcoCash transaction
5. Customer receives push notification on phone

## Obtaining iVeri Credentials

1. Contact iVeri: https://www.iveri.com
2. Request merchant account
3. They will provide:
   - Application ID (GUID format)
   - Certificate ID (GUID format)
4. Test vs Live modes:
   - Use Test credentials for development
   - Switch to Live for production

## Troubleshooting

### "No payment methods showing"
- **Check**: Run STEP 6 from `SETUP_IVERI_GATEWAY.sql`
- **Fix**: Ensure `is_active = true` and RLS policy allows SELECT

### "Unauthorized during payment"
- **Check**: Edge function logs in Supabase dashboard
- **Fix**: Ensure edge function is deployed and has correct env variables

### "Payment fails immediately"
- **Check**: iVeri credentials are correct
- **Test**: Use iVeri test cards (get from iVeri documentation)

### "EcoCash not working"
- **Verify**: Phone number format is correct (e.g., 771234567)
- **Check**: iVeri account supports EcoCash transactions

## Summary of Files Created

1. ✅ `SETUP_IVERI_GATEWAY.sql` - Complete setup and verification script
2. ⚠️ `supabase/functions/process-payment/index.ts` - **YOU NEED TO CREATE THIS**
3. ✅ Frontend code already integrated in `CheckoutPage.tsx`

## Next Steps

1. **Run** `SETUP_IVERI_GATEWAY.sql` in Supabase SQL Editor (steps 1-6)
2. **Get** iVeri credentials from your merchant account
3. **Update** credentials in STEP 3 of the SQL script
4. **Create** the edge function (template provided above)
5. **Deploy** the edge function
6. **Test** with a small transaction

Let me know if you need help with any of these steps!
