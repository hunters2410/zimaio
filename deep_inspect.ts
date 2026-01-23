
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

async function deepInspect() {
    console.log("--- DEEP INSPECTION ---");

    // Commissions
    const { data: comms } = await supabase.from('commissions').select('*');
    console.log(`Commissions: ${comms?.length || 0}`);

    // Vendor Profiles
    const { data: vendors } = await supabase.from('vendor_profiles').select('id, shop_name, total_sales');
    console.log(`Vendor Profiles: ${vendors?.length || 0}`);
    vendors?.forEach(v => console.log(`Vendor ${v.shop_name}: Total Sales=${v.total_sales}`));

    // Wallet Transactions
    const { data: txs } = await supabase.from('wallet_transactions_detailed').select('*');
    console.log(`Wallet Transactions (Detailed): ${txs?.length || 0}`);

    // Legacy Transactions
    const { data: legacyTxs } = await supabase.from('wallet_transactions').select('*');
    console.log(`Wallet Transactions (Legacy): ${legacyTxs?.length || 0}`);
}

deepInspect();
