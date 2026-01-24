import { supabase } from '@/lib/supabase';

// Define minimal types to avoid managing complex shared types
export interface PaymentGateway {
    id: string;
    gateway_name: string;
    gateway_type: string;
    display_name: string;
    description: string | null;
    is_active: boolean;
    is_default: boolean;
    configuration?: Record<string, any>;
    logo_url?: string;
    supported_currencies?: string[]; // ISO codes
    instructions?: string;
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface PaymentInitiateRequest {
    order_id: string;
    gateway_type: string;
    amount: number;
    currency: string;
    return_url: string; // The URL to redirect back to after payment
    metadata?: Record<string, any>; // Extra data (e.g., Paynow email, Stripe token)
}

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

    async initiatePayment(request: PaymentInitiateRequest): Promise<any> {
        // Explicitly use the supabase url from the mobile client
        const apiUrl = `${(supabase as any).supabaseUrl}/functions/v1/process-payment`;

        // Get the current user's session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        const token = session.access_token;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Pass User Token, not Anon Key
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[PaymentService] Error ${response.status}:`, errorText);
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || errorJson.message || `Payment initiation failed with status ${response.status}`);
            } catch (e: any) {
                // If JSON parse fails, check if we already threw our specific error
                if (e.message && e.message.startsWith('Payment initiation failed')) throw e;
                throw new Error(errorText || `Payment initiation failed with status ${response.status}`);
            }
        }

        return await response.json();
    },
};
