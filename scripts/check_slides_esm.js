
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSlides() {
    const { data, error } = await supabase
        .from('home_slides')
        .select('*')
        .eq('is_active', true);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Active slides found:', data.length);
        console.log(data);
    }
}

checkSlides();
