import { StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { paymentService, PaymentGateway } from '@/services/paymentService'; // Local mobile service
import * as Linking from 'expo-linking';

// ... other imports

interface ShippingMethod {
    id: string;
    display_name: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
    min_order_total?: number;
    max_order_total?: number;
}

export default function CheckoutScreen() {
    const { cartItems, clearCart } = useCart();
    const { calculatePrice, settings } = useSettings();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const router = useRouter();

    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>(''); // 'iveri_card', 'iveri_ecocash', 'paynow', etc.
    // iVeri State
    const [cardDetails, setCardDetails] = useState({ pan: '', expiry: '', cvv: '' });
    const [ecocashNumber, setEcocashNumber] = useState('');
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'Zimbabwe' });

    const fetchData = async () => {
        try {
            const [shippingRes, gatewaysRes] = await Promise.all([
                supabase.from('shipping_methods').select('*').eq('is_active', true),
                paymentService.getActiveGateways()
            ]);

            if (shippingRes.error) throw shippingRes.error;

            if (shippingRes.data) {
                setShippingMethods(shippingRes.data);
                const pickup = shippingRes.data.find(m => m.id === 'pickup') || shippingRes.data[0];
                setSelectedShipping(pickup || null);
            }

            if (gatewaysRes) {
                setGateways(gatewaysRes);
                // Default logic mirroring web
                if (gatewaysRes.some(g => g.gateway_type === 'iveri')) {
                    setPaymentMethod('iveri_card');
                    setSelectedGateway(gatewaysRes.find(g => g.gateway_type === 'iveri') || null);
                } else if (gatewaysRes.length > 0) {
                    setPaymentMethod(gatewaysRes[0].gateway_type);
                    setSelectedGateway(gatewaysRes[0]);
                }
            }
        } catch (error) {
            console.error('Error loading checkout data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
        });

        fetchData();
    }, []);

    // Calculations
    const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);

    const { totalTax, totalCommission, totalMerchandise } = cartItems.reduce((acc, item) => {
        const prices = calculatePrice(item.base_price);
        return {
            totalTax: acc.totalTax + (prices.vat * item.quantity),
            totalCommission: acc.totalCommission + (prices.commission * item.quantity),
            totalMerchandise: acc.totalMerchandise + (prices.total * item.quantity) // prices.total includes base+vat+comm
        };
    }, { totalTax: 0, totalCommission: 0, totalMerchandise: 0 });

    const shippingCost = selectedShipping ? selectedShipping.base_cost : 0;
    const grandTotal = totalMerchandise + shippingCost;

    // Filter available shipping methods based on order total if logic exists (simplified here)
    // Web logic: return totalWithTax >= min && (max === null || totalWithTax <= max);
    const availableShippingMethods = shippingMethods.filter(method => {
        const min = method.min_order_total || 0;
        const max = method.max_order_total;
        // Using totalMerchandise for comparison logic
        return totalMerchandise >= min && (max === null || max === undefined || totalMerchandise <= max);
    });

    const handlePlaceOrder = async () => {
        if (!selectedGateway) {
            Alert.alert('Error', 'Please select a payment method');
            return;
        }

        // Validation for iVeri
        if (paymentMethod === 'iveri_card') {
            if (!cardDetails.pan || !cardDetails.expiry || !cardDetails.cvv) {
                Alert.alert('Error', 'Please enter valid card details');
                return;
            }
        } else if (paymentMethod === 'iveri_ecocash') {
            if (!ecocashNumber) {
                Alert.alert('Error', 'Please enter your EcoCash number');
                return;
            }
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Please log in to place an order');

            // 1. Group items by Vendor
            const itemsByVendor = cartItems.reduce((acc, item) => {
                const vid = item.vendor_id || 'unknown';
                if (!acc[vid]) acc[vid] = [];
                acc[vid].push(item);
                return acc;
            }, {} as Record<string, typeof cartItems>);

            const vendorIds = Object.keys(itemsByVendor);

            // Create Orders (parallel)
            const orderPromises = vendorIds.map(async (vendorId) => {
                const items = itemsByVendor[vendorId];

                // Calculate Vendor Totals
                const vendorCalcs = items.reduce((acc, item) => {
                    const p = calculatePrice(item.base_price);
                    return {
                        tax: acc.tax + (p.vat * item.quantity),
                        comm: acc.comm + (p.commission * item.quantity),
                        total: acc.total + (p.total * item.quantity)
                    };
                }, { tax: 0, comm: 0, total: 0 });

                // Distribute shipping cost evenly across orders for MVP
                const portionShipping = shippingCost / vendorIds.length;
                const orderTotal = vendorCalcs.total + portionShipping;

                // Generate Order Number
                const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const { data: order, error } = await supabase
                    .from('orders')
                    .insert({
                        order_number: orderNumber,
                        customer_id: user.id,
                        vendor_id: vendorId,
                        status: 'pending',
                        payment_status: 'pending',
                        payment_method: selectedGateway.gateway_type,
                        shipping_method_id: selectedShipping?.id === 'pickup' ? null : selectedShipping?.id,
                        shipping_address: selectedShipping?.id === 'pickup' ? { type: 'pickup' } : address,
                        subtotal: items.reduce((s, i) => s + (i.base_price * i.quantity), 0),
                        tax_total: vendorCalcs.tax,
                        shipping_total: portionShipping,
                        total: orderTotal,
                        commission_amount: vendorCalcs.comm,
                        items: items // Add items snapshot
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Create Order Items
                const orderItems = items.map(item => ({
                    order_id: order.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.base_price,
                    total_price: item.base_price * item.quantity
                }));

                await supabase.from('order_items').insert(orderItems);
                return order;
            });

            const createdOrders = await Promise.all(orderPromises);
            const firstOrder = createdOrders[0];

            // 2. Initiate Payment
            let metadata: any = {
                customer_id: user.id,
                full_cart_payment: true,
                order_ids: createdOrders.map(o => o.id)
            };

            // Add Gateway specific metadata
            if (paymentMethod === 'iveri_card') {
                metadata = {
                    ...metadata,
                    card_pan: cardDetails.pan.replace(/\s/g, ''),
                    card_expiry: cardDetails.expiry,
                    card_cvv: cardDetails.cvv,
                    payment_subtype: 'card'
                };
            } else if (paymentMethod === 'iveri_ecocash') {
                const cleanPhone = ecocashNumber.replace(/\D/g, '');
                metadata = {
                    ...metadata,
                    card_pan: `910012${cleanPhone}`,
                    card_expiry: '1228',
                    card_cvv: '',
                    payment_subtype: 'ecocash'
                };
            }

            // Initiate
            const response = await paymentService.initiatePayment({
                order_id: firstOrder.id,
                gateway_type: selectedGateway.gateway_type, // Still 'iveri' for both subtypes
                amount: grandTotal,
                currency: 'USD',
                return_url: Linking.createURL('/'),
                metadata: metadata
            });

            if (response.redirect_url) {
                Linking.openURL(response.redirect_url);
            } else if (response.success) {
                // Direct Success (e.g. some synchronous gateways/mocks)
                clearCart();
                router.replace('/');
                Alert.alert('Success', 'Payment Successful!');
                return; // Skip the bottom success alert to avoid double
            } else if (response.instructions) {
                Alert.alert('Instructions', response.instructions);
            }

            Alert.alert('Success', 'Order placed successfully!', [
                {
                    text: 'OK', onPress: () => {
                        clearCart();
                        router.replace('/');
                    }
                }
            ]);

        } catch (error: any) {
            console.error('Order Error:', error);
            Alert.alert('Error', error.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background }]}>
                <FontAwesome name="lock" size={64} color={colors.textSecondary} style={{ marginBottom: 24 }} />
                <Text style={[styles.sectionTitle, { color: colors.text, textAlign: 'center', marginBottom: 8 }]}>Sign In Required</Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 32 }}>
                    Please sign in or create an account to complete your checkout.
                </Text>

                <TouchableOpacity
                    style={[styles.placeOrderBtn, { backgroundColor: colors.primary, width: '100%', marginBottom: 16, justifyContent: 'center' }]}
                    onPress={() => router.push('/login?returnTo=/checkout')}
                >
                    <Text style={styles.placeOrderText}>Sign In</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.placeOrderBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary, width: '100%', justifyContent: 'center' }]}
                    onPress={() => router.push('/signup?returnTo=/checkout')}
                >
                    <Text style={[styles.placeOrderText, { color: colors.primary }]}>Create Account</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Default to a fallback 'Pickup' if list empty but maybe manual
    const methodsToShow = availableShippingMethods.length > 0 ? availableShippingMethods : (
        selectedShipping ? [selectedShipping] : []
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ title: 'Checkout', headerBackTitle: 'Cart' }} />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 1. Address Section (if not pickup) */}
                {selectedShipping?.id !== 'pickup' && (
                    <View style={[styles.section, { backgroundColor: colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Address</Text>
                        <TextInput
                            placeholder="Street Address"
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholderTextColor={colors.textSecondary}
                            value={address.street}
                            onChangeText={t => setAddress({ ...address, street: t })}
                        />
                        <View style={styles.row}>
                            <TextInput
                                placeholder="City"
                                style={[styles.input, { flex: 1, marginRight: 8, color: colors.text, borderColor: colors.border }]}
                                placeholderTextColor={colors.textSecondary}
                                value={address.city}
                                onChangeText={t => setAddress({ ...address, city: t })}
                            />
                            <TextInput
                                placeholder="State/Province"
                                style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
                                placeholderTextColor={colors.textSecondary}
                                value={address.state}
                                onChangeText={t => setAddress({ ...address, state: t })}
                            />
                        </View>
                    </View>
                )}

                {/* 2. Shipping Method */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Method</Text>

                    {/* Always show Pickup Option if manually wanted, or if database has it. 
                        Web code handles hardcoded pickup + db methods. 
                        For simplicity, if 'pickup' is in db, it shows. If not, we can add it manually or rely on DB. 
                        Let's rely on DB content or the logic above. */}

                    {/* Add hardcoded Pickup if not present and usually free */}
                    {!methodsToShow.find(m => m.id === 'pickup') && (
                        <TouchableOpacity
                            style={[
                                styles.shippingOption,
                                { borderColor: selectedShipping?.id === 'pickup' ? colors.primary : colors.border },
                                selectedShipping?.id === 'pickup' && { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }
                            ]}
                            onPress={() => setSelectedShipping({ id: 'pickup', display_name: 'Store Pickup', base_cost: 0, delivery_time_min: 0, delivery_time_max: 0 })}
                        >
                            <View>
                                <Text style={[styles.shippingName, { color: colors.text }]}>Store Pickup</Text>
                                <Text style={[styles.shippingTime, { color: colors.textSecondary }]}>Collect directly</Text>
                            </View>
                            <Text style={[styles.shippingPrice, { color: colors.primary }]}>FREE</Text>
                        </TouchableOpacity>
                    )}

                    {methodsToShow.map(method => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.shippingOption,
                                { borderColor: selectedShipping?.id === method.id ? colors.primary : colors.border },
                                selectedShipping?.id === method.id && { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }
                            ]}
                            onPress={() => setSelectedShipping(method)}
                        >
                            <View>
                                <Text style={[styles.shippingName, { color: colors.text }]}>{method.display_name}</Text>
                                <Text style={[styles.shippingTime, { color: colors.textSecondary }]}>{method.delivery_time_min}-{method.delivery_time_max} Days</Text>
                            </View>
                            <Text style={[styles.shippingPrice, { color: colors.text }]}>${method.base_cost.toFixed(2)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 3. Payment Method */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
                    {gateways.map((gateway) => {
                        if (gateway.gateway_type === 'iveri') {
                            return (
                                <View key={gateway.id}>
                                    {/* iVeri Card Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.shippingOption,
                                            { borderColor: paymentMethod === 'iveri_card' ? colors.primary : colors.border },
                                            paymentMethod === 'iveri_card' && { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }
                                        ]}
                                        onPress={() => { setPaymentMethod('iveri_card'); setSelectedGateway(gateway); }}
                                    >
                                        <View>
                                            <Text style={[styles.shippingName, { color: colors.text }]}>Credit/Debit Card</Text>
                                            <Text style={[styles.shippingTime, { color: colors.textSecondary }]}>In-Store Card Payment</Text>
                                        </View>
                                        {paymentMethod === 'iveri_card' && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
                                    </TouchableOpacity>

                                    {/* iVeri EcoCash Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.shippingOption,
                                            { borderColor: paymentMethod === 'iveri_ecocash' ? colors.primary : colors.border },
                                            paymentMethod === 'iveri_ecocash' && { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }
                                        ]}
                                        onPress={() => { setPaymentMethod('iveri_ecocash'); setSelectedGateway(gateway); }}
                                    >
                                        <View>
                                            <Text style={[styles.shippingName, { color: colors.text }]}>EcoCash</Text>
                                            <Text style={[styles.shippingTime, { color: colors.textSecondary }]}>Mobile Money</Text>
                                        </View>
                                        {paymentMethod === 'iveri_ecocash' && <FontAwesome name="check-circle" size={20} color={colors.primary} />}
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={gateway.id}
                                style={[
                                    styles.shippingOption,
                                    { borderColor: paymentMethod === gateway.gateway_type ? colors.primary : colors.border },
                                    paymentMethod === gateway.gateway_type && { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }
                                ]}
                                onPress={() => { setPaymentMethod(gateway.gateway_type); setSelectedGateway(gateway); }}
                            >
                                <View>
                                    <Text style={[styles.shippingName, { color: colors.text }]}>{gateway.display_name}</Text>
                                    <Text style={[styles.shippingTime, { color: colors.textSecondary }]}>{gateway.description}</Text>
                                </View>
                                {paymentMethod === gateway.gateway_type && (
                                    <FontAwesome name="check-circle" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Inputs for iVeri Card */}
                    {paymentMethod === 'iveri_card' && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.text }]}>Card Details</Text>
                            <TextInput
                                placeholder="Card Number"
                                value={cardDetails.pan}
                                onChangeText={t => setCardDetails({ ...cardDetails, pan: t })}
                                keyboardType="numeric"
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    placeholder="MMYY"
                                    value={cardDetails.expiry}
                                    onChangeText={t => setCardDetails({ ...cardDetails, expiry: t })}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    style={[styles.input, { flex: 1, marginRight: 8, color: colors.text, borderColor: colors.border }]}
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <TextInput
                                    placeholder="CVV"
                                    value={cardDetails.cvv}
                                    onChangeText={t => setCardDetails({ ...cardDetails, cvv: t })}
                                    keyboardType="numeric"
                                    maxLength={4}
                                    style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.border }]}
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>
                        </View>
                    )}

                    {/* Inputs for iVeri EcoCash */}
                    {paymentMethod === 'iveri_ecocash' && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={[styles.sectionTitle, { fontSize: 14, color: colors.text }]}>EcoCash Number</Text>
                            <TextInput
                                placeholder="077 123 4567"
                                value={ecocashNumber}
                                onChangeText={setEcocashNumber}
                                keyboardType="phone-pad"
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>
                    )}

                    {gateways.length === 0 && <Text style={{ color: colors.textSecondary }}>No payment methods available.</Text>}
                </View>

                {/* 4. Order Summary & Price Breakdown */}
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: colors.textSecondary }}>Subtotal ({cartItems.length} items)</Text>
                        <Text style={{ color: colors.text }}>${subtotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: colors.textSecondary }}>Handling Fee</Text>
                        <Text style={{ color: colors.text }}>${totalCommission.toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: colors.textSecondary }}>VAT ({(settings?.default_rate || 15)}%)</Text>
                        <Text style={{ color: colors.text }}>${totalTax.toFixed(2)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={{ color: colors.textSecondary }}>Shipping</Text>
                        <Text style={{ color: colors.text }}>${shippingCost.toFixed(2)}</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Grand Total</Text>
                        <Text style={[styles.grandTotalPrice, { color: colors.primary }]}>${grandTotal.toFixed(2)}</Text>
                    </View>
                </View>

            </ScrollView>

            <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.placeOrderBtn, { backgroundColor: colors.primary }]} onPress={handlePlaceOrder}>
                    <Text style={styles.placeOrderText}>Place Order</Text>
                    <Text style={styles.placeOrderTotal}>${grandTotal.toFixed(2)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        fontSize: 14,
    },
    row: {
        flexDirection: 'row',
    },
    shippingOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    shippingName: {
        fontWeight: '700',
        fontSize: 14,
    },
    shippingTime: {
        fontSize: 12,
    },
    shippingPrice: {
        fontWeight: 'bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    divider: {
        height: 1,
        marginVertical: 12,
    },
    grandTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    grandTotalPrice: {
        fontSize: 18,
        fontWeight: '900',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        paddingBottom: 30,
    },
    placeOrderBtn: {
        height: 54,
        borderRadius: 27,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    placeOrderText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeOrderTotal: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 16,
        fontWeight: '700',
    },
});
