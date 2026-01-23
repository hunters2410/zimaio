
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAdminRole() {
    console.log("--- DEBUG ADMIN ROLE ---");

    // 1. Get current profiles to see who has admin
    const { data: admins, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'admin');

    if (error) {
        console.error('Error fetching admins:', error);
    } else {
        console.log('Admins list:', admins);
    }

    // 2. Check if there are any wallets at all
    const { data: wallets, error: wError } = await supabase
        .from('wallets')
        .select('*');

    if (wError) {
        console.error('Wallets error (RLS check):', wError);
    } else {
        console.log(`Wallets visible: ${wallets?.length || 0}`);
        wallets?.forEach(w => console.log(`Wallet for user_id: ${w.user_id}`));
    }
}

debugAdminRole();
