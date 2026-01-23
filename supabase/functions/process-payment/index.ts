import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Paynow } from 'npm:paynow@2.2.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  order_id: string;
  gateway_type: 'paynow' | 'paypal' | 'stripe' | 'iveri' | 'cash' | 'manual';
  amount: number;
  currency: string;
  return_url?: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentRequest: PaymentRequest = await req.json();
    const { order_id, gateway_type, amount, currency, return_url, metadata } = paymentRequest;

    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('customer_id', user.id)
      .maybeSingle();

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: gateway } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('gateway_type', gateway_type)
      .eq('is_active', true)
      .maybeSingle();

    if (!gateway) {
      return new Response(
        JSON.stringify({ error: 'Payment gateway not available' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: transaction } = await supabase
      .from('payment_transactions')
      .insert({
        order_id,
        user_id: user.id,
        gateway_id: gateway.id,
        gateway_type,
        amount,
        currency,
        status: 'pending',
        metadata: metadata || {},
      })
      .select()
      .single();

    if (gateway_type === 'paynow') {
      const config = gateway.configuration;
      const paynow = new Paynow(config.integration_id, config.integration_key);
      paynow.resultUrl = config.result_url;
      paynow.returnUrl = return_url || config.return_url;

      const payment = paynow.createPayment(transaction.id, user.email || user.id);
      payment.add(`Order ${order.order_number}`, amount);

      const response = await paynow.send(payment);

      if (response.success) {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'processing',
            gateway_transaction_id: response.pollUrl,
            transaction_reference: response.reference,
          })
          .eq('id', transaction.id);

        return new Response(
          JSON.stringify({
            success: true,
            transaction_id: transaction.id,
            redirect_url: response.redirectUrl,
            poll_url: response.pollUrl,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        await supabase
          .from('payment_transactions')
          .update({
            status: 'failed',
            error_message: 'PayNow initialization failed',
          })
          .eq('id', transaction.id);

        return new Response(
          JSON.stringify({ error: 'Payment initialization failed' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

    } else if (gateway_type === 'iveri') {
      const config = gateway.configuration;

      // Check metadata for Subtype (Card vs EcoCash vs Lite)
      const subtype = metadata?.payment_subtype;

      if (subtype === 'card' || subtype === 'ecocash') {
        // --- iVeri Enterprise REST API ---

        const certificateId = config.certificate_id || "{4c96973f-71dd-4044-802d-6e234effe8f2}";
        const applicationId = config.application_id;

        if (!applicationId) throw new Error("iVeri Application ID missing");

        // 2. Prepare Payload
        // Enterprise REST API V2.0
        const amountInCents = Math.round(amount * 100).toString();

        const iveriPayload: any = {
          "Version": "2.0",
          "CertificateID": certificateId,
          "ProductType": "Enterprise",
          "ProductVersion": "WebAPI",
          "Direction": "Request",
          "Transaction": {
            "ApplicationID": applicationId,
            "Command": "Debit",
            "Mode": config.mode || "Live",
            "MerchantReference": `ORD-${order.id.slice(0, 8)}`,
            "Currency": currency || "USD",
            "Amount": amountInCents,
            "ExpiryDate": metadata?.card_expiry, // MMYY
            "PAN": metadata?.card_pan,
          }
        };

        // Add CVV if it's a card payment
        if (metadata?.card_cvv) {
          iveriPayload.Transaction.CVV = metadata.card_cvv;
        }

        // 3. Make Request
        const apiUrl = config.api_url || "https://portal.iveri.com/Enterprise/REST";

        console.log(`[iVeri] Initiating ${subtype} payment. Mode: ${iveriPayload.Transaction.Mode}`);
        console.log(`[iVeri] URL: ${apiUrl}`);

        const iveriResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(iveriPayload)
        });

        if (!iveriResponse.ok) {
          const rawError = await iveriResponse.text();
          console.error(`[iVeri] HTTP Error ${iveriResponse.status}:`, rawError);
          throw new Error(`iVeri API responded with status ${iveriResponse.status}`);
        }

        const iveriResult = await iveriResponse.json();
        console.log("[iVeri] Final Response:", JSON.stringify(iveriResult));

        // 4. Handle Response
        // Expected: { "Transaction": { "Result": { "Status": "0", "Description": "Approved" } } }
        // Status "0" is usually success. "-1" is denied.

        const resultParams = iveriResult?.Transaction?.Result;
        const status = resultParams?.Status;
        const description = resultParams?.Description;

        if (status === "0") {
          // Success
          await supabase
            .from('payment_transactions')
            .update({
              status: 'completed',
              transaction_reference: resultParams?.RequestID || iveriResult?.Transaction?.RequestID,
              gateway_transaction_id: resultParams?.Source,
              metadata: { ...metadata, iveri_result: iveriResult }
            })
            .eq('id', transaction.id);

          // Also Update Order Status
          await supabase
            .from('orders')
            .update({
              status: 'processing',
              payment_status: 'paid'
            })
            .eq('id', order_id);

          return new Response(
            JSON.stringify({
              success: true,
              transaction_id: transaction.id,
              redirect_url: null, // No redirect needed
              message: "Payment Approved"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } else {
          // Failed
          await supabase
            .from('payment_transactions')
            .update({
              status: 'failed',
              error_message: description || 'Payment Denied',
              metadata: { ...metadata, iveri_result: iveriResult }
            })
            .eq('id', transaction.id);

          return new Response(
            JSON.stringify({
              success: false,
              error: description || "Payment Declined by Gateway"
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 200 OK so frontend handles logic, or 400? Let's do 200 with success:false
          );
        }

      } else {
        // --- iVeri Lite (Redirect) Fallback ---
        const baseUrl = config.base_url || 'https://portal.iveri.com/Lite/Transactions/New/CheckOut';
        const merchantId = config.application_id || config.merchant_id;

        if (!merchantId) {
          throw new Error('iVeri Application ID is missing in configuration');
        }

        const amountInCents = Math.round(amount * 100);

        const params = new URLSearchParams({
          ApplicationID: merchantId,
          Amount: amountInCents.toString(),
          Currency: currency || 'USD',
          MerchantReference: `ORD-${order.id.slice(0, 8)}`,
          ReturnURL: return_url || config.return_url || 'http://localhost:5173/checkout/success',
          ErrorURL: return_url ? `${return_url}?error=true` : 'http://localhost:5173/checkout/error',
        });

        // Update transaction
        await supabase
          .from('payment_transactions')
          .update({
            status: 'pending', // User is redirected
            transaction_reference: `ORD-${order.id.slice(0, 8)}`,
          })
          .eq('id', transaction.id);

        const redirectUrl = `${baseUrl}?${params.toString()}`;

        return new Response(
          JSON.stringify({
            success: true,
            transaction_id: transaction.id,
            redirect_url: redirectUrl,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (gateway_type === 'cash') {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'pending',
        })
        .eq('id', transaction.id);

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transaction.id,
          message: 'Cash on delivery selected',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else if (gateway_type === 'manual') {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'pending',
        })
        .eq('id', transaction.id);

      const { data: instructions } = await supabase
        .from('payment_instructions')
        .select('*')
        .eq('gateway_id', gateway.id)
        .order('step_number');

      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transaction.id,
          instructions: instructions || [],
          message: 'Please follow the payment instructions',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Payment method not yet implemented' }),
      {
        status: 501,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});