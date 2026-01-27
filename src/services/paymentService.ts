import { supabase as defaultSupabase } from '../lib/supabase';
import type { PaymentGateway, PaymentTransaction, PaymentInstruction, PaymentInitiateRequest } from '../types/payment';

let supabase = defaultSupabase;

export const paymentService = {
  setSupabase(client: any) {
    supabase = client;
  },

  async getActiveGateways(): Promise<PaymentGateway[]> {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllGateways(): Promise<PaymentGateway[]> {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getGatewayById(id: string): Promise<PaymentGateway | null> {
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateGateway(id: string, updates: Partial<PaymentGateway>): Promise<void> {
    const { data, error } = await supabase
      .from('payment_gateways')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Update failed: Record not found or permission denied. Check if you have administrator roles assigned.');
    }
  },

  async createManualGateway(gateway: Omit<PaymentGateway, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentGateway> {
    const { data, error } = await supabase
      .from('payment_gateways')
      .insert({
        gateway_name: gateway.gateway_name,
        gateway_type: 'manual',
        display_name: gateway.display_name,
        description: gateway.description,
        is_active: gateway.is_active,
        is_default: false,
        configuration: gateway.configuration || {},
        supported_currencies: gateway.supported_currencies,
        instructions: gateway.instructions,
        logo_url: gateway.logo_url,
        sort_order: gateway.sort_order,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGateway(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getInstructions(gatewayId: string): Promise<PaymentInstruction[]> {
    const { data, error } = await supabase
      .from('payment_instructions')
      .select('*')
      .eq('gateway_id', gatewayId)
      .order('step_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async saveInstructions(gatewayId: string, instructions: Omit<PaymentInstruction, 'id' | 'gateway_id' | 'created_at'>[]): Promise<void> {
    await supabase
      .from('payment_instructions')
      .delete()
      .eq('gateway_id', gatewayId);

    if (instructions.length > 0) {
      const { error } = await supabase
        .from('payment_instructions')
        .insert(
          instructions.map((inst) => ({
            gateway_id: gatewayId,
            step_number: inst.step_number,
            title: inst.title,
            description: inst.description,
          }))
        );

      if (error) throw error;
    }
  },

  async createTransaction(transaction: Omit<PaymentTransaction, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentTransaction> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: Partial<PaymentTransaction>): Promise<void> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('Update failed: Transaction not found or permission denied.');
    }
  },

  async getTransactionById(id: string): Promise<PaymentTransaction | null> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserTransactions(userId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllTransactions(): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async initiatePayment(request: PaymentInitiateRequest): Promise<any> {
    console.log("🔐 Initiating payment - checking authentication...");

    const apiUrl = `${(supabase as any).supabaseUrl}/functions/v1/process-payment`;
    console.log("📍 API URL:", apiUrl);

    // Get the current user's session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ Session error:", sessionError);
      throw new Error('Failed to get authentication session. Please refresh the page and try again.');
    }

    if (!session) {
      console.error("❌ No session found");
      throw new Error('User not authenticated. Please log in to continue with payment.');
    }

    if (!session.access_token) {
      console.error("❌ Session exists but no access token");
      throw new Error('Invalid session. Please log out and log in again.');
    }

    console.log("✅ Session valid");
    console.log("   User ID:", session.user.id);
    console.log("   Token preview:", session.access_token.substring(0, 20) + "...");
    console.log("   Token expires:", new Date(session.expires_at! * 1000).toLocaleString());

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      console.warn("⚠️  Token appears to be expired, refreshing...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        console.error("❌ Token refresh failed:", refreshError);
        throw new Error('Session expired. Please log out and log in again.');
      }

      console.log("✅ Token refreshed successfully");
    }

    console.log("📤 Sending payment request...");
    console.log("   Order ID:", request.order_id);
    console.log("   Gateway:", request.gateway_type);
    console.log("   Amount:", request.amount);
    console.log("   Currency:", request.currency);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': (supabase as any).supabaseKey, // Add anon key as backup
        },
        body: JSON.stringify(request),
      });

      console.log("📥 Response received:");
      console.log("   Status:", response.status, response.statusText);
      console.log("   Headers:", Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log("   Raw response:", responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON");
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (!response.ok) {
        console.error("❌ API returned error:");
        console.error(result);
        throw new Error(result.error || result.message || 'Payment initiation failed');
      }

      console.log("✅ Payment API call successful");
      console.log(result);

      return result;

    } catch (fetchError: any) {
      console.error("❌ Fetch error:");
      console.error(fetchError);

      if (fetchError.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      throw fetchError;
    }
  },
};
