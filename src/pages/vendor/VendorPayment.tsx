import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    CreditCard,
    ShieldCheck,
    Zap,
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Banknote,
    Smartphone,
    Globe
} from 'lucide-react';

interface PaymentGateway {
    id: string;
    gateway_name: string;
    display_name: string;
    description: string;
    gateway_type: string;
    logo_url: string;
}

export function VendorPayment() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const packageId = searchParams.get('packageId');
    const planName = searchParams.get('plan');

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
    const [pkgDetails, setPkgDetails] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!packageId) {
            navigate('/vendor/dashboard?tab=packages');
            return;
        }
        fetchData();
    }, [packageId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Package Details
            const { data: pkg } = await supabase
                .from('vendor_packages')
                .select('*')
                .eq('id', packageId)
                .single();
            setPkgDetails(pkg);

            // 2. Fetch Active Payment Gateways
            const { data: activeGateways } = await supabase
                .from('payment_gateways')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            setGateways(activeGateways || []);
            if (activeGateways?.length) setSelectedGateway(activeGateways[0].id);

        } catch (error) {
            console.error('Error fetching payment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedGateway || !packageId || !profile) return;

        setProcessing(true);
        try {
            // Simulation of payment processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 1. Update/Create Subscription
            const { error: subError } = await supabase
                .from('vendor_subscriptions')
                .upsert({
                    vendor_id: profile.id, // Fixed: uses user profile id as per schema
                    package_id: packageId,
                    status: 'active',
                    billing_cycle: 'monthly',
                    last_payment_date: new Date().toISOString(),
                    next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                }, { onConflict: 'vendor_id' });

            if (subError) throw subError;

            // 2. Create Transaction Record
            const { error: txError } = await supabase
                .from('payment_transactions')
                .insert({
                    user_id: profile.id,
                    amount: pkgDetails.price_monthly,
                    currency: 'USD',
                    status: 'completed',
                    gateway_id: selectedGateway,
                    gateway_type: gateways.find(g => g.id === selectedGateway)?.gateway_type,
                    metadata: { package_id: packageId, plan_name: planName }
                });

            if (txError) throw txError;

            setStatus('success');
            setTimeout(() => {
                navigate('/vendor/dashboard?tab=packages');
            }, 3000);

        } catch (error) {
            console.error('Payment error:', error);
            setStatus('error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Securing session...</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-green-100 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase">Payment Verified!</h2>
                    <p className="text-gray-500 mb-8 font-medium">Your subscription to <span className="text-purple-600 font-black">{planName}</span> is now active. Redirecting you to your dashboard...</p>
                    <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full animate-progress" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] py-12 px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: Summary */}
                <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-purple-50 rounded-2xl">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Order Summary</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Selected Plan</p>
                                    <p className="text-xl font-black text-gray-900">{planName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Duration</p>
                                    <p className="text-sm font-bold text-gray-600">Monthly</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Subscription Fee</span>
                                    <span className="tabular-nums">${pkgDetails?.price_monthly}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>Admin Fees</span>
                                    <span className="tabular-nums">$0.00</span>
                                </div>
                                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                                    <span className="text-lg font-black text-gray-900 uppercase">Total Amount</span>
                                    <span className="text-3xl font-black text-purple-600 tabular-nums">${pkgDetails?.price_monthly}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-4">
                            <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
                            <p className="text-xs text-blue-800 leading-relaxed font-bold">
                                Your payment details are encrypted and never stored on our servers. You're protected by enterprise-grade security.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right: Payment Methods */}
                <div className="lg:col-span-7 space-y-8 order-1 lg:order-2">
                    <div className="flex flex-col gap-2 mb-4 px-4">
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Finalize Payment</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Step 2 of 2: Secure Checkout</p>
                    </div>

                    <div className="space-y-4">
                        {gateways.map((gateway) => (
                            <button
                                key={gateway.id}
                                onClick={() => setSelectedGateway(gateway.id)}
                                className={`w-full group relative transition-all duration-300 ${selectedGateway === gateway.id
                                    ? 'scale-[1.02]'
                                    : 'hover:scale-[1.01]'
                                    }`}
                            >
                                <div className={`p-6 rounded-[2rem] border-2 flex items-center transition-all ${selectedGateway === gateway.id
                                    ? 'bg-white border-purple-600 shadow-2xl shadow-purple-900/10'
                                    : 'bg-white/50 border-gray-100 hover:border-purple-200'
                                    }`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${selectedGateway === gateway.id ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-purple-50'
                                        }`}>
                                        {gateway.gateway_type === 'paynow' && <Smartphone className="w-7 h-7" />}
                                        {gateway.gateway_type === 'paypal' && <CreditCard className="w-7 h-7" />}
                                        {gateway.gateway_type === 'stripe' && <Globe className="w-7 h-7" />}
                                        {!['paynow', 'paypal', 'stripe'].includes(gateway.gateway_type) && <Banknote className="w-7 h-7" />}
                                    </div>

                                    <div className="ml-6 text-left flex-1">
                                        <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">{gateway.display_name}</h4>
                                        <p className="text-xs text-gray-500 font-bold tracking-wide mt-0.5">{gateway.description}</p>
                                    </div>

                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedGateway === gateway.id ? 'border-purple-600 bg-purple-600' : 'border-gray-200'
                                        }`}>
                                        {selectedGateway === gateway.id && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in" />}
                                    </div>
                                </div>
                            </button>
                        ))}

                        {gateways.length === 0 && (
                            <div className="p-12 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-200">
                                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active payment methods found</p>
                            </div>
                        )}
                    </div>

                    <button
                        disabled={processing || !selectedGateway}
                        onClick={handlePayment}
                        className="w-full mt-10 relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 group-hover:scale-105 transition-transform duration-500" />
                        <div className="relative py-6 rounded-[2rem] flex items-center justify-center gap-4 text-white font-black uppercase tracking-widest shadow-2xl shadow-purple-900/30 active:scale-[0.98] transition-all disabled:opacity-50">
                            {processing ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Processing Securely...
                                </>
                            ) : (
                                <>
                                    Complete Payment <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                    </button>

                    <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-8">
                        Verified Secure by Zimaio Trust
                    </p>
                </div>
            </div>
        </div>
    );
}
