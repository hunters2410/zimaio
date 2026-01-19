const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- DB Connection Test ---');
console.log('URL:', supabaseUrl ? 'FOUND' : 'MISSING');
console.log('KEY:', supabaseAnonKey ? 'FOUND' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        // Attempt to select from categories which usually exists
        const { data, error } = await supabase.from('categories').select('id, name').limit(1);

        if (error) {
            console.log('RESULT: FAILED');
            console.log('ERROR:', error.message);
            process.exit(1);
        } else {
            console.log('RESULT: SUCCESS');
            console.log('CONNECTION: ACTIVE');
            process.exit(0);
        }
    } catch (err) {
        console.log('RESULT: UNEXPECTED ERROR');
        process.exit(1);
    }
}

testConnection();
