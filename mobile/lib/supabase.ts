import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://mnkncdqalkamhmtfcykm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua25jZHFhbGthbWhtdGZjeWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjQ1OTAsImV4cCI6MjA4NDQwMDU5MH0.9Hxdgh_-wQImFfq3Tb8OHPkSN2oRjR_AzMAY1jn1ZQk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
