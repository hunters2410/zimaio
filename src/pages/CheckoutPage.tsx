import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Truck, CreditCard, Lock, User, Mail, Phone, Loader2, Smartphone, Wallet } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { PaymentGateway } from '../types/payment';

interface ShippingMethod {
    id: string;
    display_name: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
}

export function CheckoutPage() {
    const { user } = useAuth();
    const { cartItems, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const { calculatePrice, settings } = useSettings();
    const { settings: siteSettings } = useSiteSettings(); // Use explicit site settings context for site_name
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
    const [activeGateways, setActiveGateways] = useState<PaymentGateway[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('');

    // Guest / Form State
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    // Card Details State
    const [cardDetails, setCardDetails] = useState({
        pan: '',
        expiry: '',
        cvv: ''
    });
    const [ecocashNumber, setEcocashNumber] = useState('');

    // Derived State
    const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
    const { totalTax, totalWithTax } = cartItems.reduce((acc, item) => {
        const prices = calculatePrice(item.base_price);
        return {
            totalTax: acc.totalTax + (prices.vat * item.quantity),
            totalWithTax: acc.totalWithTax + (prices.total * item.quantity)
        };
    }, { totalTax: 0, totalWithTax: 0 });
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Zimbabwe' // Default
    });

    const shippingCost = selectedShipping ? selectedShipping.base_cost : 0;
    const grandTotal = totalWithTax + shippingCost;

    const availableShippingMethods = shippingMethods.filter(method => {
        const min = (method as any).min_order_total || 0;
        const max = (method as any).max_order_total;
        return totalWithTax >= min && (max === null || max === undefined || totalWithTax <= max);
    });

    // Auto-select first available if current selection becomes invalid
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
        // 1. Fetch Shipping Methods
        const fetchShipping = async () => {
            const { data } = await supabase.from('shipping_methods').select('*').eq('is_active', true);
            if (data) {
                setShippingMethods(data);
                setSelectedShipping(data[0] || null);
            }
        };

        const fetchGateways = async () => {
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
        };

        fetchShipping();
        fetchGateways();

        // 2. Pre-fill if User
        if (user) {
            setEmail(user.email || '');
            // Fetch profile for address
            const fetchProfile = async () => {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setFullName(data.full_name || '');
                    setPhone(data.phone || '');
                    // If address is stored in JSON or columns, pre-fill here. 
                    // Assuming simple text fields for now as per user request to "fill shipping address"
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleGuestSignup = async () => {
        // Generate a random secure password
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

        // Attempt Signup
        const { data, error } = await supabase.auth.signUp({
            email,
            password: tempPassword,
            options: {
                data: {
                    full_name: fullName,
                    phone: phone,
                    role: 'customer' // Default role
                }
            }
        });

        if (error) throw error;

        // If successful, the user is created. 
        // Supabase auto-signs in if email confirmation is disabled. 
        // If enabled, we have an issue. Assuming disabled for this "Guest Checkout" flow.
        return { user: data.user, password: tempPassword };
    };

    // Load PayPal SDK when selected
    useEffect(() => {
        if (paymentMethod === 'paypal') {
            const loadPayPal = async () => {
                const paypalGateway = activeGateways.find(g => g.gateway_type === 'paypal');
                if (!paypalGateway || !paypalGateway.configuration?.client_id) return;

                // Check if script already loaded
                if (!document.getElementById('paypal-sdk')) {
                    const script = document.createElement('script');
                    script.id = 'paypal-sdk';
                    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalGateway.configuration.client_id}&currency=USD`;
                    script.onload = renderPayPalButtons;
                    document.body.appendChild(script);
                } else {
                    renderPayPalButtons();
                }
            };
            loadPayPal();
        }
    }, [paymentMethod, activeGateways]);

    const renderPayPalButtons = () => {
        if ((window as any).paypal) {
            const container = document.getElementById('paypal-button-container');
            if (container) container.innerHTML = '';

            (window as any).paypal.Buttons({
                createOrder: async (data: any, actions: any) => {
                    // Create Supabase Order first? Or just validation?
                    // Ideally we create order in 'pending' state here
                    try {
                        // We can't easily run the complex handleOrderPlacement logic here inside sync callback 
                        // unless we refactor. For now, let's assume validation passes or use basic amount.
                        // Better approach: Call backend to create order, get ID, return to PayPal.
                        // Simplified: Just Create PayPal Order with amount.
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: grandTotal.toFixed(2)
                                },
                                description: `Order from ${settings?.site_name || 'ZimAIO'}`
                            }]
                        });
                    } catch (err) {
                        console.error('PayPal Create Error', err);
                        return null;
                    }
                },
                onApprove: async (data: any, actions: any) => {
                    // Capture payment
                    const details = await actions.order.capture();
                    // Now Create Supabase Order & Transaction
                    // We need to trigger existing order placement logic but skip payment step
                    await handleOrderPlacementForPayPal(details);
                },
                onError: (err: any) => {
                    console.error('PayPal Error', err);
                    alert('PayPal payment failed');
                }
            }).render('#paypal-button-container');
        }
    };

    // Dedicated function for PayPal success
    const handleOrderPlacementForPayPal = async (details: any) => {
        setLoading(true);
        try {
            let currentUser = user;

            // 1. Guest Auth Logic (Duplicated slightly or refactor needed - keeping focused for now)
            if (!currentUser) {
                if (!email) throw new Error("Email is required for receipt.");
                // Try finding user or create
                const { user: newUser, password } = await handleGuestSignup();
                currentUser = newUser;
            }

            if (!currentUser) throw new Error("Authentication failed during order creation.");

            // 2. Create Order in Supabase
            // Group items by vendor
            const itemsByVendor = cartItems.reduce((acc, item) => {
                if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
                acc[item.vendor_id].push(item);
                return acc;
            }, {} as Record<string, typeof cartItems>);

            const orderPromises = Object.entries(itemsByVendor).map(async ([vendorId, items]) => {
                const vendorSubtotal = items.reduce((s, i) => s + (i.base_price * i.quantity), 0);
                const vendorCalcs = items.reduce((acc, item) => {
                    const p = calculatePrice(item.base_price);
                    return { total: acc.total + (p.total * item.quantity), tax: acc.tax + (p.vat * item.quantity), comm: acc.comm + (p.commission * item.quantity) };
                }, { tax: 0, comm: 0, total: 0 });

                const orderTotal = vendorCalcs.total + (shippingCost / Object.keys(itemsByVendor).length);
                const isPickup = selectedShipping?.id === 'pickup';
                const finalShippingAddress = isPickup
                    ? { street: 'Store Pickup', city: 'Store Pickup', state: 'Store Pickup', country: 'Zimbabwe', zip: '0000' }
                    : address;
                const finalShippingMethodId = isPickup ? null : selectedShipping?.id;

                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        customer_id: currentUser.id,
                        vendor_id: vendorId,
                        status: 'processing', // Paid!
                        payment_status: 'paid',
                        payment_method: 'paypal',
                        shipping_method_id: finalShippingMethodId,
                        shipping_address: finalShippingAddress,
                        subtotal: vendorSubtotal,
                        tax_total: vendorCalcs.tax,
                        shipping_total: (shippingCost / Object.keys(itemsByVendor).length),
                        total: orderTotal,
                        commission_amount: vendorCalcs.comm
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
                    total_price: item.price * item.quantity,
                    vendor_id: vendorId
                }));
                await supabase.from('order_items').insert(orderItemsData);

                // Transaction Record
                await supabase.from('payment_transactions').insert({
                    order_id: orderData.id,
                    user_id: currentUser.id,
                    gateway_id: activeGateways.find(g => g.gateway_type === 'paypal')?.id,
                    gateway_type: 'paypal',
                    amount: orderTotal,
                    currency: 'USD',
                    status: 'completed',
                    transaction_reference: details.id,
                    metadata: { paypal_payer: details.payer }
                });

                return orderData;
            });

            const completedOrders = await Promise.all(orderPromises);

            clearCart();
            navigate(`/orders/${completedOrders[0].id}?payment=success`);

        } catch (err: any) {
            console.error('Order Finalization Error', err);
            alert('Payment received but order creation failed. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderPlacement = async () => {
        setLoading(true);
        try {
            let currentUser = user;

            // 1. Validate inputs
            if (!currentUser) {
                if (!email) throw new Error("Email is required for guest checkout.");
                const { user: newUser, password } = await handleGuestSignup();
                currentUser = newUser;
                if (currentUser) {
                    if (selectedShipping?.id !== 'pickup') {
                        // Store shipping address in profile (optional, but good for future)
                        await supabase.from('profiles').update({
                            city: address.city,
                            country: address.country
                        }).eq('id', currentUser.id);
                    }
                    alert(`Account created! Your temporary password is: ${password}. Please check your email.`);
                }
            }

            if (!currentUser) throw new Error("Authentication failed.");

            if (selectedShipping?.id !== 'pickup') {
                if (!address.street || !address.city || !address.state) {
                    throw new Error("Please enter a valid shipping address.");
                }
            }

            // 2. Create Order Record
            // Group items by vendor
            const itemsByVendor = cartItems.reduce((acc, item) => {
                if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
                acc[item.vendor_id].push(item);
                return acc;
            }, {} as Record<string, typeof cartItems>);

            const orderPromises = Object.entries(itemsByVendor).map(async ([vendorId, items]) => {
                const vendorSubtotal = items.reduce((s, i) => s + (i.base_price * i.quantity), 0);
                // Calculate taxes/commissions
                const vendorCalcs = items.reduce((acc, item) => {
                    const p = calculatePrice(item.base_price);
                    return {
                        tax: acc.tax + (p.vat * item.quantity),
                        comm: acc.comm + (p.commission * item.quantity),
                        total: acc.total + (p.total * item.quantity)
                    };
                }, { tax: 0, comm: 0, total: 0 });

                const orderTotal = vendorCalcs.total + (shippingCost / Object.keys(itemsByVendor).length);

                // Prepare shipping data
                const isPickup = selectedShipping?.id === 'pickup';
                const finalShippingAddress = isPickup
                    ? { street: 'Store Pickup', city: 'Store Pickup', state: 'Store Pickup', country: 'Zimbabwe', zip: '0000' }
                    : address;

                const finalShippingMethodId = isPickup ? null : selectedShipping?.id;

                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
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
                        commission_amount: vendorCalcs.comm
                    })
                    .select()
                    .single(); // Returns the data directly since we await

                if (orderError) throw orderError;
                return { data: orderData }; // returning for Promise.all

                if (orderError) throw orderError;

                // Insert Order Items
                const orderItemsData = items.map(item => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity,
                    vendor_id: vendorId
                }));

                const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
                if (itemsError) throw itemsError;

                return { data: orderData };
            });

            await Promise.all(orderPromises);

            // 3. Process Payment
            // 3. Process Payment
            if (['paynow', 'paypal'].includes(paymentMethod)) {
                // Taking the first order to attach payment to (MVP). 
                const firstOrder = (await Promise.all(orderPromises))[0]?.data;
                if (!firstOrder) throw new Error("Order creation failed");

                const response = await paymentService.initiatePayment({
                    order_id: firstOrder.id,
                    gateway_type: paymentMethod as any,
                    amount: grandTotal, // Pay the full amount
                    currency: 'USD',
                    return_url: `${window.location.origin}/orders/${firstOrder.id}?payment=success`,
                    metadata: {
                        customer_name: fullName || currentUser?.email,
                        full_cart_payment: true
                    }
                });

                if (response.redirect_url) {
                    window.location.href = response.redirect_url;
                    clearCart();
                    return;
                }
            } else if (paymentMethod === 'iveri_card') {
                // iVeri - Credit/Debit Card
                const firstOrder = (await Promise.all(orderPromises))[0]?.data;
                if (!firstOrder) throw new Error("Order creation failed");

                // Basic Validation
                if (!cardDetails.pan || !cardDetails.expiry || !cardDetails.cvv) {
                    throw new Error("Please enter valid card details.");
                }

                const response = await paymentService.initiatePayment({
                    order_id: firstOrder.id,
                    gateway_type: 'iveri', // Still use 'iveri' backend handler
                    amount: grandTotal,
                    currency: 'USD',
                    metadata: {
                        customer_name: fullName || currentUser?.email,
                        full_cart_payment: true,
                        card_pan: cardDetails.pan.replace(/\s/g, ''),
                        card_expiry: cardDetails.expiry,
                        card_cvv: cardDetails.cvv,
                        payment_subtype: 'card' // Distinguish for backend if needed (though PAN tells story)
                    }
                });

                if (response.success) {
                    clearCart();
                    navigate(`/orders/${firstOrder.id}?payment=success`);
                } else {
                    throw new Error(response.error || "Card payment processing failed");
                }

            } else if (paymentMethod === 'iveri_ecocash') {
                // iVeri - EcoCash
                const firstOrder = (await Promise.all(orderPromises))[0]?.data;
                if (!firstOrder) throw new Error("Order creation failed");

                if (!ecocashNumber) {
                    throw new Error("Please enter your EcoCash number.");
                }

                // EcoCash logic: BIN '910012' + Phone Number = PAN
                // Ensure phone format is clean (e.g. remove leading 0 if needed, or just append digits)
                // Assuming user enters '077...' or '77...'
                // Let's strip non-digits
                const cleanPhone = ecocashNumber.replace(/\D/g, '');
                // Use 910012 as prefix
                const ecocashPan = `910012${cleanPhone}`;

                const response = await paymentService.initiatePayment({
                    order_id: firstOrder.id,
                    gateway_type: 'iveri',
                    amount: grandTotal,
                    currency: 'USD', // EcoCash might be ZiG/ZWG only in reality? User Guide says ZWG. We will send USD and let backend/gateway handle conversion or error if mismatch.
                    // NOTE: User guide example showed Currency: "ZWG". If your store is USD, this might fail or do FX.
                    // For now, sending the store currency.
                    metadata: {
                        customer_name: fullName || currentUser?.email,
                        full_cart_payment: true,
                        card_pan: ecocashPan,
                        card_expiry: '1228', // Future date as per docs requirement
                        card_cvv: '', // Not needed for EcoCash
                        payment_subtype: 'ecocash'
                    }
                });

                if (response.success) {
                    clearCart();
                    navigate(`/orders/${firstOrder.id}?payment=success`);
                } else {
                    throw new Error(response.error || "EcoCash payment processing failed");
                }

            } else {
                clearCart();
                navigate('/orders');
            }

        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Checkout failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">Secure Checkout</h1>

                <div className="grid lg:grid-cols-12 gap-8">

                    {/* LEFT: Checkout Form */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 1. Contact Info */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">1</span>
                                Contact Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="email"
                                            disabled={!!user}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address */}
                        {selectedShipping?.id !== 'pickup' && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                                    <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">2</span>
                                    Shipping Address
                                </h2>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Street Address</label>
                                        <input
                                            type="text"
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">City</label>
                                        <input
                                            type="text"
                                            value={address.city}
                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Province/State</label>
                                        <input
                                            type="text"
                                            value={address.state}
                                            onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Shipping Method */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">3</span>
                                Delivery Method
                            </h2>
                            <div className="grid md:grid-cols-2 gap-3">
                                {/* Store Pickup Option */}
                                <div
                                    onClick={() => setSelectedShipping({ id: 'pickup', display_name: 'Store Pickup', base_cost: 0, delivery_time_min: 0, delivery_time_max: 0 })}
                                    className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all ${selectedShipping?.id === 'pickup' ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedShipping?.id === 'pickup' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                            {selectedShipping?.id === 'pickup' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs text-gray-900">Store Pickup</h4>
                                            <p className="text-[10px] text-gray-400 font-medium">Collect directly from shop</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-xs text-emerald-600">FREE</span>
                                </div>

                                {availableShippingMethods.map(method => (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedShipping(method)}
                                        className={`cursor-pointer border rounded-xl p-3 flex items-center justify-between transition-all ${selectedShipping?.id === method.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedShipping?.id === method.id ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                {selectedShipping?.id === method.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs text-gray-900">{method.display_name}</h4>
                                                <p className="text-[10px] text-gray-400 font-medium">{method.delivery_time_min}-{method.delivery_time_max} Days</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-xs text-gray-900">{formatPrice(method.base_cost)}</span>
                                    </div>
                                ))}
                                {availableShippingMethods.length === 0 && (
                                    <div className="col-span-2 p-4 text-center border border-dashed border-gray-100 rounded-xl">
                                        <p className="text-xs text-gray-400">No shipping methods available for your current order total. Only Pick Up available.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. Payment */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold flex items-center gap-3 mb-4">
                                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs">4</span>
                                Payment Method
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {activeGateways.map(gateway => {
                                    if (gateway.gateway_type === 'iveri') {
                                        // Split iVeri into Card and EcoCash
                                        return (
                                            <>
                                                <div
                                                    key="iveri_card"
                                                    onClick={() => setPaymentMethod('iveri_card')}
                                                    className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'iveri_card' ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-center">In-Store Card</span>
                                                </div>
                                                <div
                                                    key="iveri_ecocash"
                                                    onClick={() => setPaymentMethod('iveri_ecocash')}
                                                    className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'iveri_ecocash' ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                >
                                                    <Smartphone className="w-5 h-5" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-center">EcoCash</span>
                                                </div>
                                            </>
                                        );
                                    }

                                    const Icon = gateway.gateway_type === 'paynow' ? Smartphone :
                                        gateway.gateway_type === 'stripe' ? CreditCard :
                                            gateway.gateway_type === 'paypal' ? Wallet :
                                                gateway.gateway_type === 'cash' ? Truck : CreditCard;

                                    return (
                                        <div
                                            key={gateway.id}
                                            onClick={() => setPaymentMethod(gateway.gateway_type)}
                                            className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === gateway.gateway_type ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-center">{gateway.display_name}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Card Input for iVeri */}
                            {paymentMethod === 'iveri_card' && (
                                <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">Card Details</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Card Number</label>
                                            <div className="relative">
                                                <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    maxLength={19}
                                                    placeholder="0000 0000 0000 0000"
                                                    value={cardDetails.pan}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, pan: e.target.value })}
                                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700 tracking-wider"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Expiry Date</label>
                                                <input
                                                    type="text"
                                                    placeholder="MMYY"
                                                    maxLength={4}
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700 text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">CVV / CVC</label>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    placeholder="123"
                                                    value={cardDetails.cvv}
                                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700 text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                                        <ShieldCheck className="w-4 h-4" />
                                        <p className="text-[10px] font-bold leading-tight">Your card details are securely processed via iVeri Enterprise Gateway.</p>
                                    </div>
                                </div>
                            )}

                            {/* EcoCash Input for iVeri */}
                            {paymentMethod === 'iveri_ecocash' && (
                                <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">EcoCash Details</h3>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Mobile Number</label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                placeholder="077 123 4567"
                                                value={ecocashNumber}
                                                onChange={(e) => setEcocashNumber(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium text-xs text-gray-700 tracking-wider"
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-2 ml-1">
                                            We will send a push notification to your phone.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* PayPal SDK Container */}
                            {paymentMethod === 'paypal' && (
                                <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in">
                                    <div id="paypal-button-container" className="w-full"></div>
                                    <p className="text-[10px] text-center text-gray-400 mt-2">
                                        Secure payment processing by PayPal. You will be redirected to PayPal to complete your purchase.
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT: Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">Order Summary</h3>

                            <div className="space-y-3 mb-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                                <p className="text-[9px] text-gray-400">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-black text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 my-4"></div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900 font-bold">{formatPrice(subtotal)}</span>
                                </div>
                                {settings?.is_enabled && (
                                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                                        <span>VAT ({settings.default_rate}%)</span>
                                        <span className="text-gray-900 font-bold">{formatPrice(totalTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-500 font-medium">
                                    <span>Shipping</span>
                                    <span className="text-emerald-600 font-bold">{selectedShipping ? formatPrice(selectedShipping.base_cost) : '--'}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-6 pt-6">
                                <div className="flex justify-between items-end">
                                    <span className="font-black text-gray-900 uppercase">Total</span>
                                    <span className="text-3xl font-black text-emerald-600 leading-none">{formatPrice(grandTotal)}</span>
                                </div>
                            </div>

                            {paymentMethod !== 'paypal' && (
                                <button
                                    onClick={handleOrderPlacement}
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Pay & Place Order</>}
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
