const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function check() {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const { data } = await supabase.from('vendor_profiles').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns in vendor_profiles:', Object.keys(data[0]));
    } else {
        console.log('No vendor profiles found to check columns.');
    }
}
check();
