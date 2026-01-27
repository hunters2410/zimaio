import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : '';

// Validate environment variables
if (!supabaseUrl || supabaseUrl === '' || supabaseUrl.includes('placeholder')) {
  console.error('❌ VITE_SUPABASE_URL is not configured!');
  console.error('Please create a .env file with your Supabase URL');
  console.error('Example: VITE_SUPABASE_URL=https://your-project.supabase.co');
}

if (!supabaseAnonKey || supabaseAnonKey === '' || supabaseAnonKey === 'placeholder') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not configured!');
  console.error('Please create a .env file with your Supabase anon key');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__SUPABASE_CLIENT__ = supabase;
  console.log('✅ Supabase client initialized');
  console.log('   URL:', supabaseUrl || 'NOT SET');
  console.log('   Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET');
}

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
