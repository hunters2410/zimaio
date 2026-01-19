export type PaymentGatewayType = 'paynow' | 'paypal' | 'stripe' | 'cash' | 'manual';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

export interface PaymentGateway {
  id: string;
  gateway_name: string;
  gateway_type: PaymentGatewayType;
  display_name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
  configuration: Record<string, any>;
  supported_currencies: string[];
  transaction_fee_percentage?: number;
  transaction_fee_fixed?: number;
  instructions?: string;
  logo_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  order_id: string;
  user_id: string;
  gateway_id?: string;
  gateway_type: PaymentGatewayType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_reference?: string;
  gateway_transaction_id?: string;
  metadata: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentInstruction {
  id: string;
  gateway_id: string;
  step_number: number;
  title: string;
  description: string;
  created_at: string;
}

export interface PayNowConfig {
  integration_id: string;
  integration_key: string;
  return_url: string;
  result_url: string;
}

export interface PayPalConfig {
  client_id: string;
  client_secret: string;
  mode: 'sandbox' | 'live';
}

export interface StripeConfig {
  publishable_key: string;
  secret_key: string;
}

export interface PaymentInitiateRequest {
  order_id: string;
  gateway_type: PaymentGatewayType;
  amount: number;
  currency: string;
  return_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiateResponse {
  success: boolean;
  transaction_id?: string;
  redirect_url?: string;
  poll_url?: string;
  error?: string;
}
