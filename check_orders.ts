
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

async function checkOrders() {
    console.log("--- ORDERS CHECK ---");
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total, commission_amount, payment_status, status, vendor_id, customer_id');

    if (error) console.error(error);
    else {
        console.log(`Found ${orders?.length} orders.`);
        orders?.forEach(o => {
            console.log(`Order ${o.id}: Total=${o.total}, Comm=${o.commission_amount}, Payment=${o.payment_status}, Status=${o.status}`);
        });
    }
}

checkOrders();
