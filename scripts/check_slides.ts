
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

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
        .select('*');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Slides found:', data);
        console.log('Count:', data.length);
        console.log('Active slides:', data.filter(s => s.is_active));
    }
}

checkSlides();
