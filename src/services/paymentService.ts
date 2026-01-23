import { supabase } from '../lib/supabase';
import type { PaymentGateway, PaymentTransaction, PaymentInstruction, PaymentInitiateRequest } from '../types/payment';

export const paymentService = {
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
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment initiation failed');
    }

    return await response.json();
  },
};
