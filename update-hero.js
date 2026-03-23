import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnkncdqalkamhmtfcykm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua25jZHFhbGthbWhtdGZjeWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjQ1OTAsImV4cCI6MjA4NDQwMDU5MH0.9Hxdgh_-wQImFfq3Tb8OHPkSN2oRjR_AzMAY1jn1ZQk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateHero() {
    console.log('Fetching slides...');
    const { data: slides, error: fetchError } = await supabase
        .from('home_slides')
        .select('*')
        .order('sort_order', { ascending: true });

    if (fetchError) {
        console.error('Error fetching:', fetchError);
        return;
    }

    if (slides && slides.length > 0) {
        const slideToUpdate = slides[0];
        console.log('Updating slide:', slideToUpdate.title);

        const { error: updateError } = await supabase
            .from('home_slides')
            .update({
                title: "Zimbabwe's Online Marketplace — Shop from Multiple Vendors and Pay Securely.",
                subtitle: "Discover, shop, and support Zimbabwean businesses. Secure payments. Reliable delivery."
            })
            .eq('id', slideToUpdate.id);

        if (updateError) {
            console.error('Update failed:', updateError);
        } else {
            console.log('Hero section updated successfully!');
        }
    } else {
        console.log('No slides found. Creating a new one...');
        const { error: insertError } = await supabase
            .from('home_slides')
            .insert({
                title: "Zimbabwe's Online Marketplace — Shop from Multiple Vendors and Pay Securely.",
                subtitle: "Discover, shop, and support Zimbabwean businesses. Secure payments. Reliable delivery.",
                image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop",
                link_url: "/products",
                button_text: "Browse Collection",
                is_active: true,
                sort_order: 1
            });

        if (insertError) {
            console.error('Insert failed:', insertError);
        } else {
            console.log('New hero slide created successfully!');
        }
    }
}

updateHero();
