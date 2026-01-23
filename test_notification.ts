
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

async function testNotification() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.log("No logged in user to test with.");
        return;
    }

    // Try to find an admin id to send to (maybe self)
    // actually, we can just insert a notification for the current user to see if it shows up in the UI
    const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'System Test',
        message: 'Refund alert system check',
        type: 'info'
    });

    if (error) console.log("Error inserting notification:", error);
    else console.log("Inserted test notification for user", user.id);
}

testNotification();
