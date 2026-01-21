import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Truck, CreditCard, Lock, MapPin, User, Mail, Phone, Loader2, CheckCircle, Smartphone } from 'lucide-react';

interface ShippingMethod {
    id: string;
    display_name: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
}

export function CheckoutPage() {
    const { user, signIn } = useAuth(); // We might need a custom signUp method or use supabase directly
    const { cartItems, clearCart } = useCart();
    const { formatPrice } = useCurrency();
    const { calculatePrice, settings } = useSettings();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('card');

    // Guest / Form State
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'Zimbabwe' // Default
    });

    // Derived State
    const subtotal = cartItems.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
    const { totalCommission, totalTax, totalWithTax } = cartItems.reduce((acc, item) => {
        const prices = calculatePrice(item.base_price);
        return {
            totalCommission: acc.totalCommission + (prices.commission * item.quantity),
            totalTax: acc.totalTax + (prices.vat * item.quantity),
            totalWithTax: acc.totalWithTax + (prices.total * item.quantity)
        };
    }, { totalCommission: 0, totalTax: 0, totalWithTax: 0 });

    const shippingCost = selectedShipping ? selectedShipping.base_cost : 0;
    const grandTotal = totalWithTax + shippingCost;

    useEffect(() => {
        // 1. Fetch Shipping Methods
        const fetchShipping = async () => {
            const { data } = await supabase.from('shipping_methods').select('*').eq('is_active', true);
            if (data) {
                setShippingMethods(data);
                setSelectedShipping(data[0] || null);
            }
        };
        fetchShipping();

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

    const handleOrderPlacement = async () => {
        setLoading(true);
        try {
            let currentUser = user;

            // 1. Handle Guest Auth
            if (!currentUser) {
                if (!email) throw new Error("Email is required for guest checkout.");
                const { user: newUser, password } = await handleGuestSignup();
                currentUser = newUser;
                if (currentUser) {
                    // Store shipping address in profile (optional, but good for future)
                    await supabase.from('profiles').update({
                        city: address.city,
                        country: address.country
                    }).eq('id', currentUser.id);

                    alert(`Account created! Your temporary password is: ${password}. Please check your email.`);
                }
            }

            if (!currentUser) throw new Error("Authentication failed.");

            // 2. Create Order Record
            // We need to group items by Vendor to create split orders? 
            // Or one big order? Schema usually suggests 'orders' likely has 'vendor_id'.
            // If Cart has mixed vendors, we create MULTIPLE orders.

            // Group items by vendor
            const itemsByVendor = cartItems.reduce((acc, item) => {
                if (!acc[item.vendor_id]) acc[item.vendor_id] = [];
                acc[item.vendor_id].push(item);
                return acc;
            }, {} as Record<string, typeof cartItems>);

            const orderPromises = Object.entries(itemsByVendor).map(async ([vendorId, items]) => {
                const vendorSubtotal = items.reduce((s, i) => s + (i.base_price * i.quantity), 0);
                // Calculate taxes/commissions for this sub-order
                const vendorCalcs = items.reduce((acc, item) => {
                    const p = calculatePrice(item.base_price);
                    return {
                        tax: acc.tax + (p.vat * item.quantity),
                        comm: acc.comm + (p.commission * item.quantity),
                        total: acc.total + (p.total * item.quantity)
                    };
                }, { tax: 0, comm: 0, total: 0 });

                const orderTotal = vendorCalcs.total + (shippingCost / Object.keys(itemsByVendor).length); // Split shipping? Or apply full?
                // Simply applying full shipping to first order or splitting is complex. 
                // For now, let's just create the order.

                const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        customer_id: currentUser.id,
                        vendor_id: vendorId,
                        status: 'pending',
                        payment_status: 'paid', // Simulating successful payment
                        payment_method: paymentMethod,
                        shipping_method_id: selectedShipping?.id,
                        shipping_address: address, // JSONB usually
                        subtotal: vendorSubtotal,
                        tax_total: vendorCalcs.tax,
                        shipping_total: (shippingCost / Object.keys(itemsByVendor).length),
                        total: orderTotal,
                        commission_amount: vendorCalcs.comm
                    })
                    .select()
                    .single();

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
            });

            await Promise.all(orderPromises);

            // 3. Success
            clearCart();
            navigate('/orders'); // Redirect to order history

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
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm">1</span>
                                Contact Information
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            disabled={!!user}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                            placeholder="+263 7..."
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Shipping Address */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm">2</span>
                                Shipping Address
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Street Address</label>
                                    <input
                                        type="text"
                                        value={address.street}
                                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                        placeholder="123 Samora Machel Ave"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                        placeholder="Harare"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Province/State</label>
                                    <input
                                        type="text"
                                        value={address.state}
                                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
                                        placeholder="Harare"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Shipping Method */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm">3</span>
                                Delivery Method
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {shippingMethods.map(method => (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedShipping(method)}
                                        className={`cursor-pointer border-2 rounded-2xl p-4 flex items-center justify-between transition-all ${selectedShipping?.id === method.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedShipping?.id === method.id ? 'border-emerald-500' : 'border-gray-300'}`}>
                                                {selectedShipping?.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900">{method.display_name}</h4>
                                                <p className="text-xs text-gray-400 font-medium">{method.delivery_time_min}-{method.delivery_time_max} Days</p>
                                            </div>
                                        </div>
                                        <span className="font-black text-gray-900">{formatPrice(method.base_cost)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Payment */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                                <span className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm">4</span>
                                Payment Method
                            </h2>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'card', name: 'Credit Card', icon: CreditCard },
                                    { id: 'ecocash', name: 'EcoCash', icon: Smartphone },
                                    { id: 'cod', name: 'Cash on Delivery', icon: Truck },
                                ].map(pm => (
                                    <div
                                        key={pm.id}
                                        onClick={() => setPaymentMethod(pm.id)}
                                        className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all ${paymentMethod === pm.id ? 'border-emerald-500 bg-emerald-50/20 text-emerald-700' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        <pm.icon className="w-6 h-6" />
                                        <span className="text-xs font-bold uppercase tracking-wide">{pm.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm sticky top-24">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Order Summary</h3>

                            <div className="space-y-4 mb-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                                <img src={item.image} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                                <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-100 my-6"></div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm text-gray-500 font-bold">
                                    <span>Subtotal</span>
                                    <span className="text-gray-900">{formatPrice(subtotal)}</span>
                                </div>
                                {settings?.is_enabled && (
                                    <div className="flex justify-between text-sm text-gray-500 font-bold">
                                        <span>VAT ({settings.default_rate}%)</span>
                                        <span className="text-gray-900">{formatPrice(totalTax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm text-gray-500 font-bold">
                                    <span>Shipping</span>
                                    <span className="text-emerald-600">{selectedShipping ? formatPrice(selectedShipping.base_cost) : '--'}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 my-6 pt-6">
                                <div className="flex justify-between items-end">
                                    <span className="font-black text-gray-900 uppercase">Total</span>
                                    <span className="text-3xl font-black text-emerald-600 leading-none">{formatPrice(grandTotal)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleOrderPlacement}
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4" /> Pay & Place Order</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
