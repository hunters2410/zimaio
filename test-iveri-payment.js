// ============================================
// iVeri Payment Diagnostic Script
// ============================================
// Copy this entire code and paste it into your browser console (F12)
// Then run: testIveriPayment()

async function testIveriPayment() {
    console.log("🔍 Starting iVeri Payment Diagnostic...\n");

    // Test 1: Check Authentication
    console.log("✅ Test 1: Checking Authentication...");
    const { data: { session }, error: authError } = await window.__SUPABASE_CLIENT__.auth.getSession();

    if (!session) {
        console.error("❌ FAILED: Not authenticated");
        console.log("→ Solution: Please log in first");
        return;
    }

    console.log("✅ PASSED: User authenticated");
    console.log(`   User ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}\n`);

    // Test 2: Check Gateway Configuration
    console.log("✅ Test 2: Checking iVeri Gateway Configuration...");
    const { data: gateway, error: gatewayError } = await window.__SUPABASE_CLIENT__
        .from('payment_gateways')
        .select('*')
        .eq('gateway_type', 'iveri')
        .eq('is_active', true)
        .maybeSingle();

    if (gatewayError || !gateway) {
        console.error("❌ FAILED: Gateway not found or not active");
        console.log("→ Solution: Run configure_iveri_gateway.sql in Supabase");
        return;
    }

    console.log("✅ PASSED: Gateway found and active");
    console.log(`   Gateway ID: ${gateway.id}`);
    console.log(`   App ID: ${gateway.configuration?.application_id?.substring(0, 8)}...`);
    console.log(`   Mode: ${gateway.configuration?.mode}`);
    console.log(`   API URL: ${gateway.configuration?.api_url}\n`);

    // Test 3: Get Supabase URL
    const supabaseUrl = window.__SUPABASE_CLIENT__.supabaseUrl;
    console.log(`   Supabase URL: ${supabaseUrl}\n`);

    // Test 4: Create Test Order (you'll need to delete this later)
    console.log("✅ Test 3: Creating test order...");
    const testOrder = {
        order_number: `TEST-${Date.now()}`,
        customer_id: session.user.id,
        vendor_id: '00000000-0000-0000-0000-000000000000', // placeholder
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'iveri',
        shipping_address: { test: true },
        subtotal: 1.00,
        tax_total: 0.00,
        shipping_total: 0.00,
        total: 1.00,
        commission_amount: 0.00
    };

    const { data: order, error: orderError } = await window.__SUPABASE_CLIENT__
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

    if (orderError) {
        console.error("❌ FAILED: Could not create test order");
        console.error(orderError);
        return;
    }

    console.log("✅ PASSED: Test order created");
    console.log(`   Order ID: ${order.id}\n`);

    // Test 4: Test Payment API Call
    console.log("✅ Test 4: Testing Payment API...");
    const apiUrl = `${supabaseUrl}/functions/v1/process-payment`;

    console.log(`   API URL: ${apiUrl}`);
    console.log(`   Calling with test card: 4000000000000002\n`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: order.id,
                gateway_type: 'iveri',
                amount: 1.00,
                currency: 'USD',
                metadata: {
                    payment_subtype: 'card',
                    card_pan: '4000000000000002',
                    card_expiry: '1225',
                    card_cvv: '123',
                    customer_name: 'Test User'
                }
            })
        });

        console.log(`   HTTP Status: ${response.status} ${response.statusText}`);

        const responseText = await response.text();
        console.log(`   Raw Response: ${responseText}\n`);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("❌ FAILED: Response is not valid JSON");
            console.error(`   Response: ${responseText}`);
            return;
        }

        if (response.ok) {
            if (result.success) {
                console.log("✅ PASSED: Payment API call successful!");
                console.log("   Payment Response:");
                console.log(JSON.stringify(result, null, 2));
            } else {
                console.error("⚠️  WARNING: API returned success=false");
                console.error("   Error:", result.error || "Unknown error");
                console.log("   Full Response:");
                console.log(JSON.stringify(result, null, 2));
            }
        } else {
            console.error("❌ FAILED: HTTP error from API");
            console.error(`   Status: ${response.status}`);
            console.error("   Error:", result.error || responseText);
        }

    } catch (fetchError) {
        console.error("❌ FAILED: Network error or API not reachable");
        console.error(fetchError);
        console.log("\n→ Possible causes:");
        console.log("  1. Edge function not deployed");
        console.log("  2. Network issue");
        console.log("  3. CORS issue");
    }

    // Cleanup
    console.log("\n🧹 Cleaning up test order...");
    await window.__SUPABASE_CLIENT__.from('orders').delete().eq('id', order.id);
    console.log("✅ Test order deleted\n");

    console.log("📋 DIAGNOSTIC COMPLETE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\nIf you see errors above, please:");
    console.log("1. Screenshot this entire console output");
    console.log("2. Share it with your developer");
    console.log("3. Check the 'Possible Solutions' mentioned above");
}

console.log("✅ Diagnostic script loaded!");
console.log("Run this command to test: testIveriPayment()");
