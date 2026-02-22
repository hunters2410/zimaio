import { StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { paymentService, PaymentGateway } from '@/services/paymentService';

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
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
    const [activeGateways, setActiveGateways] = useState<PaymentGateway[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [user, setUser] = useState<any | null>(null);

    // Form State
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: 'Zimbabwe' });

    // Card Details State
    const [cardDetails, setCardDetails] = useState({ pan: '', expiry: '', cvv: '' });
    const [ecocashNumber, setEcocashNumber] = useState('');

    // Modal State for Success/Error
    const [modalConfig, setModalConfig] = useState<{
        show: boolean;
        type: 'success' | 'error';
        title: string;
        message: string;
        orderId?: string;
    }>({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Derived State - same as web
    const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
    const { totalTax, totalWithTax } = cartItems.reduce((acc, item) => {
        const prices = calculatePrice(item.base_price);
        return {
            totalTax: acc.totalTax + (prices.vat * item.quantity),
            totalWithTax: acc.totalWithTax + (prices.total * item.quantity)
        };
    }, { totalTax: 0, totalWithTax: 0 });

    const shippingCost = selectedShipping ? selectedShipping.base_cost : 0;
    const grandTotal = totalWithTax + shippingCost;

    const availableShippingMethods = shippingMethods.filter(method => {
        const min = method.min_order_total || 0;
        const max = method.max_order_total;
        return totalWithTax >= min && (max === null || max === undefined || totalWithTax <= max);
    });

    // Auto-select first available or pickup if current selection becomes invalid
    useEffect(() => {
        if (availableShippingMethods.length > 0) {
            if (!selectedShipping || (selectedShipping.id !== 'pickup' && !availableShippingMethods.find(m => m.id === selectedShipping.id))) {
                setSelectedShipping(availableShippingMethods[0]);
            }
        } else {
            // Default to pickup if no shipping methods
            if (!selectedShipping || selectedShipping.id !== 'pickup') {
                setSelectedShipping({ id: 'pickup', display_name: 'Store Pickup', base_cost: 0, delivery_time_min: 0, delivery_time_max: 0 });
            }
        }
    }, [availableShippingMethods, selectedShipping]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Shipping Methods - same as web
                const { data: shippingData } = await supabase
                    .from('shipping_methods')
                    .select('*')
                    .eq('is_active', true);

                if (shippingData) {
                    setShippingMethods(shippingData);
                    // Default to Pickup
                    setSelectedShipping({ id: 'pickup', display_name: 'Store Pickup', base_cost: 0, delivery_time_min: 0, delivery_time_max: 0 });
                }

                // 2. Fetch Payment Gateways - same as web
                const gateways = await paymentService.getActiveGateways();
                setActiveGateways(gateways);
                if (gateways.length > 0) {
                    // Default to first available, but prefer 'card' if iveri is present
                    if (gateways.some(g => g.gateway_type === 'iveri')) {
                        setPaymentMethod('iveri_card'); // Default to Card
                    } else {
                        setPaymentMethod(gateways[0].gateway_type);
                    }
                }

                // 3. Pre-fill if User
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    setEmail(user.email || '');
                    // Fetch profile
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setFullName(profile.full_name || '');
                        setPhone(profile.phone || '');
                    }
                }
            } catch (error) {
                console.error('Error loading checkout:', error);
                Alert.alert('Error', 'Failed to load checkout. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD' // Mobile uses USD by default
        }).format(price);
    };

    const handleOrderPlacement = async () => {
        // 1. Basic Identity Validation (Required for Guest and Auth users)
        if (!email) {
            Alert.alert('Error', 'Please fill in your email address first.');
            return;
        }
        if (!fullName) {
            Alert.alert('Error', 'Please enter your full name.');
            return;
        }
        if (!phone) {
            Alert.alert('Error', 'Please fill in your phone number first.');
            return;
        }

        // 2. Shipping Validation
        if (!selectedShipping) {
            Alert.alert('Error', 'Please select a shipping method.');
            return;
        }
        if (selectedShipping?.id !== 'pickup') {
            if (!address.street || !address.city || !address.state) {
                Alert.alert('Error', 'Please enter a valid shipping address.');
                return;
            }
        }


        // 3. Payment Method Validation
        if (!paymentMethod) {
            Alert.alert('Error', 'Please select a payment method.');
            return;
        }

        // 4. Card Details Validation (iVeri Card)
        if (paymentMethod === 'iveri_card') {
            // Check if all fields are filled
            if (!cardDetails.pan || !cardDetails.expiry || !cardDetails.cvv) {
                Alert.alert('Error', 'Please enter your complete credit card details.');
                return;
            }

            // Remove spaces and validate card number
            const cleanPan = cardDetails.pan.replace(/\s/g, '');

            // Validate card number length (13-19 digits)
            if (cleanPan.length < 13 || cleanPan.length > 19) {
                Alert.alert('Invalid Card', 'Card number must be between 13 and 19 digits.');
                return;
            }

            // Check if card number contains only digits
            if (!/^\d+$/.test(cleanPan)) {
                Alert.alert('Invalid Card', 'Card number must contain only digits.');
                return;
            }

            // Luhn algorithm validation (basic card number validation)
            const luhnCheck = (num: string) => {
                let sum = 0;
                let isEven = false;
                for (let i = num.length - 1; i >= 0; i--) {
                    let digit = parseInt(num.charAt(i), 10);
                    if (isEven) {
                        digit *= 2;
                        if (digit > 9) digit -= 9;
                    }
                    sum += digit;
                    isEven = !isEven;
                }
                return sum % 10 === 0;
            };

            if (!luhnCheck(cleanPan)) {
                Alert.alert('Invalid Card', 'Invalid card number. Please check and try again.');
                return;
            }

            // Validate expiry format (MMYY)
            if (cardDetails.expiry.length !== 4) {
                Alert.alert('Invalid Expiry', 'Expiry date must be in MMYY format (e.g., 1225).');
                return;
            }

            const month = parseInt(cardDetails.expiry.substring(0, 2), 10);
            const year = parseInt('20' + cardDetails.expiry.substring(2, 4), 10);

            if (month < 1 || month > 12) {
                Alert.alert('Invalid Expiry', 'Month must be between 01 and 12.');
                return;
            }

            // Check if card is expired
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                Alert.alert('Card Expired', 'This card has expired. Please use a different card.');
                return;
            }

            // Validate CVV (3 or 4 digits)
            if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
                Alert.alert('Invalid CVV', 'CVV must be 3 or 4 digits.');
                return;
            }

            if (!/^\d+$/.test(cardDetails.cvv)) {
                Alert.alert('Invalid CVV', 'CVV must contain only digits.');
                return;
            }

            // Update cardDetails with cleaned PAN
            setCardDetails({ ...cardDetails, pan: cleanPan });
        }

        // 5. EcoCash Number Validation
        if (paymentMethod === 'iveri_ecocash') {
            if (!ecocashNumber) {
                Alert.alert('Error', 'Please enter your EcoCash number.');
                return;
            }

            // Phone number validation
            const cleanPhone = ecocashNumber.replace(/\D/g, '');
            if (cleanPhone.length < 9 || cleanPhone.length > 12) {
                Alert.alert('Invalid Phone Number', 'Please enter a valid mobile number.');
                return;
            }
        }

        setLoading(true);
        try {
            let currentUser = user;

            // Guest Signup if not logged in
            if (!currentUser) {
                const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password: tempPassword,
                    options: {
                        data: {
                            full_name: fullName,
                            phone: phone,
                            role: 'customer'
                        }
                    }
                });

                if (error) throw error;
                currentUser = data.user;

                // Show password to user
                Alert.alert(
                    'Account Created',
                    `Your account has been created!\n\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease save this password.`,
                    [{ text: 'OK' }]
                );
            }

            if (!currentUser) throw new Error('Authentication failed during order creation.');

            // Group items by vendor (same as web)
            const itemsByVendor = cartItems.reduce((acc, item) => {
                if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
                acc[item.vendor_id].push(item);
                return acc;
            }, {} as Record<string, typeof cartItems>);

            const orderPromises = Object.entries(itemsByVendor).map(async ([vendorId, items]) => {
                const vendorSubtotal = items.reduce((s, i) => s + (i.base_price * i.quantity), 0);
                const vendorCalcs = items.reduce((acc, item) => {
                    const p = calculatePrice(item.base_price);
                    return {
                        total: acc.total + (p.total * item.quantity),
                        tax: acc.tax + (p.vat * item.quantity),
                        comm: acc.comm + (p.commission * item.quantity)
                    };
                }, { tax: 0, comm: 0, total: 0 });

                const orderTotal = vendorCalcs.total + (shippingCost / Object.keys(itemsByVendor).length);
                const isPickup = selectedShipping?.id === 'pickup';
                const finalShippingAddress = isPickup
                    ? { street: 'Store Pickup', city: 'Store Pickup', state: 'Store Pickup', country: 'Zimbabwe', zip: '0000' }
                    : address;
                const finalShippingMethodId = isPickup ? null : selectedShipping?.id;

                const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        order_number: orderNumber,
                        customer_id: currentUser.id,
                        vendor_id: vendorId,
                        status: 'pending',
                        payment_status: 'pending',
                        payment_method: paymentMethod,
                        shipping_method_id: finalShippingMethodId,
                        shipping_address: finalShippingAddress,
                        subtotal: vendorSubtotal,
                        tax_total: vendorCalcs.tax,
                        shipping_total: (shippingCost / Object.keys(itemsByVendor).length),
                        total: orderTotal,
                        commission_amount: vendorCalcs.comm,
                        items: items
                    })
                    .select()
                    .single();

                if (orderError) throw orderError;

                // Items
                const orderItemsData = items.map(item => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                }));
                await supabase.from('order_items').insert(orderItemsData);

                // Process payment if needed
                if (paymentMethod !== 'cash') {
                    // Determine the base gateway type (e.g., 'iveri' instead of 'iveri_card')
                    let baseGatewayType = paymentMethod;
                    let paymentSubMethod = undefined;

                    if (paymentMethod === 'iveri_card') {
                        baseGatewayType = 'iveri';
                        paymentSubMethod = 'card';
                    } else if (paymentMethod === 'iveri_ecocash') {
                        baseGatewayType = 'iveri';
                        paymentSubMethod = 'ecocash';
                    }

                    // Build metadata based on payment method
                    let paymentMetadata: any = {
                        customer_name: fullName || email,
                        full_cart_payment: true,
                        payment_subtype: paymentSubMethod
                    };

                    // Add card-specific fields for iVeri card payments
                    if (paymentMethod === 'iveri_card') {
                        paymentMetadata.card_pan = cardDetails.pan;
                        paymentMetadata.card_expiry = cardDetails.expiry;
                        paymentMetadata.card_cvv = cardDetails.cvv;
                    }

                    // Add EcoCash-specific fields
                    if (paymentMethod === 'iveri_ecocash') {
                        const cleanPhone = ecocashNumber.replace(/\D/g, '');
                        const ecocashPan = `910012${cleanPhone}`;
                        paymentMetadata.card_pan = ecocashPan;
                        paymentMetadata.card_expiry = '1228'; // Future date as required
                        paymentMetadata.card_cvv = '';
                        paymentMetadata.ecocash_number = ecocashNumber;
                    }

                    const paymentData: any = {
                        order_id: orderData.id,
                        gateway_type: baseGatewayType,
                        amount: orderTotal,
                        currency: 'USD',
                        return_url: 'zimaio://checkout/success',
                        metadata: paymentMetadata
                    };

                    console.log('=== Payment Request Debug ===');
                    console.log('Order ID:', orderData.id);
                    console.log('Gateway:', baseGatewayType);
                    console.log('Amount:', orderTotal);
                    console.log('Payment Method:', paymentSubMethod);
                    if (paymentMethod === 'iveri_card') {
                        console.log('Card (masked):', cardDetails.pan.slice(0, 4) + '****' + cardDetails.pan.slice(-4));
                    }

                    const paymentResult = await paymentService.initiatePayment(paymentData);

                    console.log('=== Payment Response ===');
                    console.log(paymentResult);

                    // Handle 3D Secure Redirect
                    if (paymentResult.redirect_url) {
                        console.log('🔐 3D Secure authentication required');
                        console.log('Redirect URL:', paymentResult.redirect_url);

                        // Show info to user
                        Alert.alert(
                            '3D Secure Verification',
                            'Your card requires additional verification. You will be redirected to complete the authentication.',
                            [
                                {
                                    text: 'Continue',
                                    onPress: async () => {
                                        try {
                                            // Open the 3D Secure page in browser
                                            const canOpen = await Linking.canOpenURL(paymentResult.redirect_url);
                                            if (canOpen) {
                                                await Linking.openURL(paymentResult.redirect_url);

                                                // Show message that payment is pending
                                                setModalConfig({
                                                    show: true,
                                                    type: 'success',
                                                    title: 'Verification Required',
                                                    message: 'Please complete the 3D Secure verification in your browser. Your order will be processed once verified.',
                                                });
                                            } else {
                                                throw new Error('Cannot open authentication page');
                                            }
                                        } catch (error) {
                                            console.error('Error opening 3D Secure URL:', error);
                                            Alert.alert('Error', 'Failed to open verification page. Please try again.');
                                        }
                                    }
                                }
                            ]
                        );
                        return; // Stop further processing
                    }

                    // Check for successful payment
                    if (!paymentResult.success) {
                        throw new Error(paymentResult.error || 'Payment failed');
                    }

                    // Update order status
                    await supabase
                        .from('orders')
                        .update({ status: 'processing', payment_status: 'paid' })
                        .eq('id', orderData.id);
                }

                return orderData;
            });

            const completedOrders = await Promise.all(orderPromises);

            // Show success modal with appropriate message
            clearCart();
            setModalConfig({
                show: true,
                type: 'success',
                title: paymentMethod === 'cash' ? 'Order Placed!' : 'Payment Successful!',
                message: paymentMethod === 'cash'
                    ? 'Your order has been placed successfully. Pay on delivery.'
                    : 'Your payment has been processed successfully. Redirecting to your orders...',
                orderId: completedOrders[0].id
            });

            // Redirect after delay
            setTimeout(() => {
                setModalConfig({ show: false, type: 'success', title: '', message: '' });
                router.push('/orders');
            }, 3000);

        } catch (error: any) {
            console.error('Order error:', error);

            // Show error modal instead of alert
            let errorMsg = error.message || 'Failed to place order. Please try again.';

            // Provide more specific error messages
            if (errorMsg.includes('not authenticated')) {
                errorMsg = 'Session expired. Please sign in and try again.';
            } else if (errorMsg.includes('gateway not available')) {
                errorMsg = 'Payment gateway is currently unavailable. Please contact support.';
            } else if (errorMsg.includes('Application ID')) {
                errorMsg = 'Payment system configuration error. Please contact support.';
            }

            setModalConfig({
                show: true,
                type: 'error',
                title: 'Transaction Failed',
                message: errorMsg
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Stack.Screen options={{ title: 'Checkout' }} />
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ marginTop: 10, color: colors.text }}>Loading checkout...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Secure Checkout' }} />

            <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}>
                {/* 1. Contact Info */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={email}
                            onChangeText={setEmail}
                            editable={!user}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>
                </View>

                {/* 2. Delivery Method */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Method</Text>

                    {/* Store Pickup - ALWAYS FIRST */}
                    <TouchableOpacity
                        style={[
                            styles.option,
                            { borderColor: selectedShipping?.id === 'pickup' ? colors.primary : colors.border },
                            selectedShipping?.id === 'pickup' && { backgroundColor: colors.highlight }
                        ]}
                        onPress={() => setSelectedShipping({ id: 'pickup', display_name: 'Store Pickup', base_cost: 0, delivery_time_min: 0, delivery_time_max: 0 })}
                    >
                        <View>
                            <Text style={[styles.optionTitle, { color: colors.text }]}>Store Pickup</Text>
                            <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>Collect directly from shop</Text>
                        </View>
                        <Text style={[styles.optionPrice, { color: colors.primary }]}>FREE</Text>
                    </TouchableOpacity>

                    {/* Other shipping methods */}
                    {availableShippingMethods.map(method => (
                        <TouchableOpacity
                            key={method.id}
                            style={[
                                styles.option,
                                { borderColor: selectedShipping?.id === method.id ? colors.primary : colors.border },
                                selectedShipping?.id === method.id && { backgroundColor: colors.highlight }
                            ]}
                            onPress={() => setSelectedShipping(method)}
                        >
                            <View>
                                <Text style={[styles.optionTitle, { color: colors.text }]}>{method.display_name}</Text>
                                <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>
                                    {method.delivery_time_min}-{method.delivery_time_max} Days
                                </Text>
                            </View>
                            <Text style={[styles.optionPrice, { color: colors.text }]}>{formatPrice(method.base_cost)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 3. Shipping Address - CONDITIONAL */}
                {selectedShipping?.id !== 'pickup' && (
                    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Address</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={address.street}
                                onChangeText={(text) => setAddress({ ...address, street: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={address.city}
                                onChangeText={(text) => setAddress({ ...address, city: text })}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Province/State</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                value={address.state}
                                onChangeText={(text) => setAddress({ ...address, state: text })}
                            />
                        </View>
                    </View>
                )}

                {/* 4. Payment */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>

                    {activeGateways.map(gateway => {
                        if (gateway.gateway_type === 'iveri') {
                            // Split iVeri into Card and EcoCash
                            return (
                                <View key={gateway.id}>
                                    <TouchableOpacity
                                        style={[
                                            styles.option,
                                            { borderColor: paymentMethod === 'iveri_card' ? colors.primary : colors.border },
                                            paymentMethod === 'iveri_card' && { backgroundColor: colors.highlight }
                                        ]}
                                        onPress={() => setPaymentMethod('iveri_card')}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <FontAwesome name="credit-card" size={20} color={colors.text} style={{ marginRight: 10 }} />
                                            <Text style={[styles.optionTitle, { color: colors.text }]}>Iveri Card</Text>
                                        </View>
                                        {paymentMethod === 'iveri_card' && (
                                            <FontAwesome name="check-circle" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.option,
                                            { borderColor: paymentMethod === 'iveri_ecocash' ? colors.primary : colors.border },
                                            paymentMethod === 'iveri_ecocash' && { backgroundColor: colors.highlight }
                                        ]}
                                        onPress={() => setPaymentMethod('iveri_ecocash')}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <FontAwesome name="mobile" size={20} color={colors.text} style={{ marginRight: 10 }} />
                                            <Text style={[styles.optionTitle, { color: colors.text }]}>EcoCash</Text>
                                        </View>
                                        {paymentMethod === 'iveri_ecocash' && (
                                            <FontAwesome name="check-circle" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        }

                        return (
                            <TouchableOpacity
                                key={gateway.id}
                                style={[
                                    styles.option,
                                    { borderColor: paymentMethod === gateway.gateway_type ? colors.primary : colors.border },
                                    paymentMethod === gateway.gateway_type && { backgroundColor: colors.highlight }
                                ]}
                                onPress={() => setPaymentMethod(gateway.gateway_type)}
                            >
                                <View>
                                    <Text style={[styles.optionTitle, { color: colors.text }]}>{gateway.display_name}</Text>
                                    {gateway.description && (
                                        <Text style={[styles.optionSubtitle, { color: colors.textSecondary }]}>{gateway.description}</Text>
                                    )}
                                </View>
                                {paymentMethod === gateway.gateway_type && (
                                    <FontAwesome name="check-circle" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Card Input for iVeri */}
                    {paymentMethod === 'iveri_card' && (
                        <View style={{ marginTop: 15 }}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Card Number</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={cardDetails.pan}
                                    onChangeText={(text) => setCardDetails({ ...cardDetails, pan: text })}
                                    keyboardType="numeric"
                                    maxLength={19}
                                />
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry (MMYY)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        value={cardDetails.expiry}
                                        onChangeText={(text) => setCardDetails({ ...cardDetails, expiry: text })}
                                        keyboardType="numeric"
                                        maxLength={4}
                                    />
                                </View>

                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>CVV</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        value={cardDetails.cvv}
                                        onChangeText={(text) => setCardDetails({ ...cardDetails, cvv: text })}
                                        keyboardType="numeric"
                                        maxLength={4}
                                        secureTextEntry
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* EcoCash Number for iVeri EcoCash */}
                    {paymentMethod === 'iveri_ecocash' && (
                        < View style={{ marginTop: 15 }}>
                            <View style={styles.inputGroup}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>EcoCash Number</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    value={ecocashNumber}
                                    onChangeText={setEcocashNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Order Summary */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(totalTax)}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Shipping</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                            {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                        </Text>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: colors.border }]}>
                        <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: colors.primary }]}>{formatPrice(grandTotal)}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* Place Order Button */}
            <View style={[
                styles.bottomBar,
                {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Math.max(insets.bottom, 20)
                }
            ]}>
                <TouchableOpacity
                    style={[styles.placeOrderButton, { backgroundColor: colors.primary }]}
                    onPress={handleOrderPlacement}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.placeOrderText}>Place Order - {formatPrice(grandTotal)}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Success/Error Modal */}
            <Modal
                visible={modalConfig.show}
                transparent={true}
                animationType="fade"
                onRequestClose={() => modalConfig.type === 'error' && setModalConfig({ ...modalConfig, show: false })}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                        {/* Icon */}
                        <View style={[
                            styles.modalIconContainer,
                            { backgroundColor: modalConfig.type === 'success' ? '#10b98120' : '#ef444420' }
                        ]}>
                            <FontAwesome
                                name={modalConfig.type === 'success' ? 'check-circle' : 'times-circle'}
                                size={60}
                                color={modalConfig.type === 'success' ? '#10b981' : '#ef4444'}
                            />
                        </View>

                        {/* Title */}
                        <Text style={[
                            styles.modalTitle,
                            {
                                color: modalConfig.type === 'success' ? colors.text : '#ef4444'
                            }
                        ]}>
                            {modalConfig.title}
                        </Text>

                        {/* Message */}
                        <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                            {modalConfig.message}
                        </Text>

                        {/* Progress Bar or Button */}
                        {modalConfig.type === 'success' ? (
                            <View style={styles.progressBarContainer}>
                                <View style={[styles.progressBar, { backgroundColor: '#10b981' }]} />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.text }]}
                                onPress={() => setModalConfig({ ...modalConfig, show: false })}
                            >
                                <Text style={styles.modalButtonText}>Try Again / Change Method</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        margin: 10,
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 10,
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: '600',
    },
    optionSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    optionPrice: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    totalRow: {
        borderTopWidth: 1,
        paddingTop: 10,
        marginTop: 5,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    bottomBar: {
        padding: 15,
        marginBottom: 10,
    },
    placeOrderButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    placeOrderText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        borderRadius: 25,
        padding: 30,
        maxWidth: 400,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        width: '100%',
        borderRadius: 3,
    },
    modalButton: {
        width: '100%',
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
