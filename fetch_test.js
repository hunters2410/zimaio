
// Renaming file or changing content. Since I cannot rename easily with replace, I'll rewrite the content to be ESM if the user's package.json says "type": "module".
// Or I can just write to fetch_test.cjs

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ua25jZHFhbGthbWhtdGZjeWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjQ1OTAsImV4cCI6MjA4NDQwMDU5MH0.9Hxdgh_-wQImFfq3Tb8OHPkSN2oRjR_AzMAY1jn1ZQk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetch() {
    console.log('Testing Product Fetch...');
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, is_active')
        .eq('is_active', true)
        .limit(5);

    if (prodError) {
        console.error('Product Error:', prodError);
    } else {
        console.log(`Found ${products.length} active products.`);
        if (products.length > 0) console.log(products[0]);
    }

    console.log('\nTesting Vendor Fetch...');
    const { data: vendors, error: vendError } = await supabase
        .from('vendor_profiles')
        .select('id, shop_name, is_approved')
        .eq('is_approved', true) // The filter used in home/explore
        .limit(5);

    if (vendError) {
        console.error('Vendor Error:', vendError);
    } else {
        console.log(`Found ${vendors.length} approved vendors.`);
        if (vendors.length > 0) console.log(vendors[0]);
    }
}

testFetch();
