const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seedData() {
    console.log('🌱 Seeding Sales Data...');

    // 1. Create/Login a Temp Customer to bypass RLS
    const email = `seeder-${Date.now()}@test.com`;
    const password = 'password123';

    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('❌ Auth Failed:', authError.message);
        return;
    }

    const user = authData.user;
    console.log('✅ Authenticated as Temp User:', user.email);

    // Re-init supabase with user session
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
    });

    // 2. Get Vendor
    const { data: vendorUser } = await supabaseAdmin.from('profiles').select('id').eq('email', 'vendor@gmail.com').single();
    const { data: vendorProfile } = await supabaseAdmin.from('vendor_profiles').select('id').eq('user_id', vendorUser.id).single();

    // 3. Create a Mock Order
    const orderNumber = `ORD-SEED-${Date.now()}`;
    const amount = 250.00; // Big amount to show up
    const commissionAmount = (amount * 4) / 100; // 10.00

    console.log(`Creating Order ${orderNumber} for $${amount}...`);

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
            order_number: orderNumber,
            customer_id: user.id, // The temp user is the customer
            vendor_id: vendorProfile.id,
            status: 'delivered',
            payment_status: 'paid',
            total: amount,
            subtotal: amount,
            commission_amount: commissionAmount,
            vat_amount: 0,
            items: [{ name: 'Premium Seed Product', quantity: 1, price: amount, id: 'seed-1' }],
            shipping_address: { address: 'Seed St' },
            billing_address: { address: 'Seed St' }
        }])
        .select()
        .single();

    if (orderError) {
        console.error('❌ Order Creation Failed:', orderError);
    } else {
        console.log('✅ Order Created:', order.id);
    }

    // 4. Verification
    await new Promise(r => setTimeout(r, 2000));
    const { data: vendorWallet } = await supabaseAdmin.from('wallets').select('*').eq('user_id', vendorUser.id).single();
    console.log('\n💰 Updated Vendor Wallet Balance:', vendorWallet?.balance_usd || vendorWallet?.balance);
}

seedData();
