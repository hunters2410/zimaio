
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Helper key for session storage
const SESSION_KEY = 'zimaio_visit_recorded';
// Helper key for ensuring we don't double count in a day if we wanted to be more strict, 
// but simply checking if this session has recorded is a good start for "visits".
// For "daily", we would need to store date. For now, simple session based.

export function useVisitorTracker() {
    useEffect(() => {
        const recordVisit = async () => {
            // Check if we already recorded a visit for this session
            if (sessionStorage.getItem(SESSION_KEY)) {
                return;
            }

            try {
                // We will try to call an RPC function 'increment_site_visits'
                // If it doesn't exist, this might fail, but it's the most secure way.
                // Alternatively, if we have a table 'site_analytics', we can try to upsert.

                // Let's assume a table 'site_stats' or 'site_analytics' exists with a 'total_visits' column 
                // or a 'visits' table where we insert a row.
                // Inserting a row is safer for concurrency than reading/updating a single row without RPC.

                // Method 1: Insert a new visit record (best for detailed analytics)
                // Table: site_visits (id, created_at, page_url, user_agent)

                const { error } = await supabase
                    .from('site_visits')
                    .insert([
                        {
                            page_url: window.location.pathname,
                            user_agent: navigator.userAgent
                        }
                    ]);

                if (!error) {
                    sessionStorage.setItem(SESSION_KEY, 'true');
                } else {
                    // If table doesn't exist, we might try a fallback or just log error
                    // console.error("Failed to record visit", error);
                }

            } catch (err) {
                // console.error("Error recording visit", err);
            }
        };

        recordVisit();
    }, []);
}
