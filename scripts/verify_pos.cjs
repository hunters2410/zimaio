
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testPOS() {
    console.log('🔄 Testing POS Order Creation...');

    // 1. Login as Vendor
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'vendor@gmail.com', // Assuming this user exists from previous context
        password: 'password123'
    });

    if (authError) {
        console.error('❌ Auth Failed:', authError.message);
        return;
    }
    console.log('✅ Logged in as:', user.email);

    // 2. Get Vendor Profile
    const { data: vendor } = await supabase.from('vendor_profiles').select('id').eq('user_id', user.id).single();
    if (!vendor) {
        console.error('❌ No vendor profile found');
        return;
    }
    console.log('✅ Vendor ID:', vendor.id);

    // 3. Get a Product
    const { data: products } = await supabase.from('products').select('id, base_price, stock_quantity').eq('vendor_id', vendor.id).limit(1);
    const product = products[0];
    if (!product) {
        console.error('❌ No products found');
        return;
    }
    console.log('✅ Product:', product.id, 'Stock:', product.stock_quantity);

    // 4. Create POS Order via RPC
    const orderPayload = {
        order_number: `POS-TEST-${Date.now()}`,
        vendor_id: vendor.id,
        customer_id: null,
        total: product.base_price,
        subtotal: product.base_price,
        commission_amount: 0,
        vat_amount: 0,
        status: 'delivered',
        payment_status: 'paid',
        payment_method: 'cash',
        shipping_address: { type: 'POS' },
        items: [{ id: product.id, quantity: 1, price: product.base_price }]
    };

    const { data: order, error } = await supabase.rpc('create_pos_order', {
        order_payload: orderPayload,
        items_payload: [{ id: product.id, quantity: 1, price: product.base_price }]
    });

    if (error) {
        console.error('❌ RPC Failed:', error.message);
        return;
    }
    console.log('✅ RPC Success. Order ID:', order.id);

    // 5. Verify Visibility (Select)
    const { data: fetchedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*, customer:profiles(email)')
        .eq('id', order.id)
        .single();

    if (fetchError) {
        console.error('❌ Fetch Failed (RLS?):', fetchError.message);
    } else {
        console.log('✅ Fetch Success:', fetchedOrder.order_number);
        console.log('   Customer:', fetchedOrder.customer);
    }

    // 6. Verify Stock
    const { data: updatedProduct } = await supabase.from('products').select('stock_quantity').eq('id', product.id).single();
    console.log('✅ Stock Updated:', updatedProduct.stock_quantity, '(Expected:', product.stock_quantity - 1, ')');

}

testPOS();
