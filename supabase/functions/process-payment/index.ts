import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { Paynow } from 'npm:paynow@2.2.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  order_id: string;
  gateway_type: 'paynow' | 'paypal' | 'stripe' | 'cash' | 'manual';
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