import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export type UserRole = 'customer' | 'vendor' | 'admin' | 'logistic';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  language_code: string;
  currency_code: string;
  two_factor_enabled: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface VendorProfile {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string | null;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  kyc_status: 'pending' | 'approved' | 'rejected';
  is_approved: boolean;
  commission_rate: number;
  rating: number;
  total_sales: number;
  created_at: string;
}
