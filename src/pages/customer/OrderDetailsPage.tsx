import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Package,
    MapPin,
    ArrowLeft,
    DollarSign,
    RotateCcw,
    Truck
} from 'lucide-react';

interface OrderItem {
    id: string; // This might be JSONB in database but we treat is as item id here
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

interface Order {
    id: string;
    order_number: string;
    status: string;
    total: number;
    items: OrderItem[];
    shipping_address: any;
    created_at: string;
    vendor_id?: string;
    delivery_info?: {
        tracking_number: string;
        status: string;
    };
}

export function OrderDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [refundAmount, setRefundAmount] = useState<number>(0);
    const [submittingRefund, setSubmittingRefund] = useState(false);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setOrder(data);
            // Default refund amount to total, can be changed if partial refunds allowed later
            if (data) setRefundAmount(data.total);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefundRequest = async () => {
        if (!order) return;
        setSubmittingRefund(true);
        try {
            const { error } = await supabase
                .from('order_refunds')
                .insert({
                    order_id: order.id,
                    customer_id: (await supabase.auth.getUser()).data.user?.id,
                    vendor_id: order.vendor_id, // Assuming orders table has vendor_id, otherwise need to fetch from items/products
                    reason: refundReason,
                    amount: refundAmount,
                    status: 'pending'
                });

            if (error) throw error;
            alert('Refund request submitted successfully');
            setRefundModalOpen(false);
        } catch (error: any) {
            console.error('Error submitting refund:', error);
            alert('Failed to submit refund request: ' + error.message);
        } finally {
            setSubmittingRefund(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Order Not Found</h2>
                <Link to="/dashboard" className="text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-widest text-xs hover:underline">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'processing': return 'bg-blue-100 text-blue-700';
            case 'paid': return 'bg-emerald-100 text-emerald-700'; // Added Paid status color
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link to="/dashboard" className="inline-flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-8 uppercase tracking-[0.2em] group transition-all">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-900/5 border-2 border-slate-50 dark:border-slate-700 overflow-hidden mb-8">
                    {/* Payment Success Banner */}
                    {location.search.includes('payment=success') && (
                        <div className="bg-emerald-500 text-white px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top duration-500">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            Payment Verification Successful! Order Secured.
                        </div>
                    )}

                    <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Order #{order.order_number}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                Logged on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                            {/* Tracking Number Display */}
                            {order.delivery_info?.tracking_number && (
                                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl border-2 border-blue-100 dark:border-blue-800/50 text-[10px] font-black uppercase tracking-widest">
                                    <Truck className="w-4 h-4" />
                                    Transit ID: <span className="font-mono tracking-[0.2em] ml-1">{order.delivery_info.tracking_number}</span>
                                </div>
                            )}
                        </div>
                        {order.status === 'delivered' && (
                            <button
                                onClick={() => setRefundModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl transition-all active:scale-95 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Dispute & Refund
                            </button>
                        )}
                    </div>

                    <div className="p-8 grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-6">Inventory Manifest</h3>
                            <div className="space-y-6">
                                {/* Assuming items is stored as JSONB array */}
                                {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-6 group">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] overflow-hidden flex-shrink-0 border-2 border-slate-100 dark:border-slate-800 group-hover:scale-105 transition-transform">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-8 h-8 text-gray-400 dark:text-slate-700 m-auto" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight line-clamp-1">{item.name}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">UNIT: {item.quantity} × ${item.price}</p>
                                        </div>
                                        <div className="font-black text-gray-900 dark:text-white tracking-tighter">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-6">Financial Audit</h3>
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 space-y-4 border-2 border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Subtotal</span>
                                        <span className="text-gray-900 dark:text-white font-black">${order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Logistics</span>
                                        <span className="text-gray-900 dark:text-white font-black">$0.00</span>
                                    </div>
                                    <div className="pt-4 border-t-2 border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Total Settlement</span>
                                        <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tighter">${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {order.shipping_address && (
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4">Shipping Destination</h3>
                                    <div className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 p-4 rounded-2xl">
                                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-cyan-500" />
                                        <div className="font-bold">
                                            <p className="text-gray-900 dark:text-white uppercase tracking-tight">{(order.shipping_address as any).address}</p>
                                            <p className="uppercase tracking-widest text-[10px] mt-1">{(order.shipping_address as any).city}, {(order.shipping_address as any).country}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {order.delivery_info?.tracking_number && (
                                <div className="mt-6 pt-6 border-t-2 border-slate-50 dark:border-slate-700">
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-4">Logistics Timeline</h3>
                                    <div className="bg-blue-500/5 dark:bg-blue-400/5 border-2 border-blue-100 dark:border-blue-900/30 rounded-2xl p-5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">Tracking Status</span>
                                            <span className="text-[10px] uppercase font-black text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-lg">{order.delivery_info.status}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">ID Reference</span>
                                            <span className="text-xs font-mono font-black text-blue-900 dark:text-blue-200 tracking-[0.1em]">{order.delivery_info.tracking_number}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {refundModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-md w-full p-10 border-2 border-white dark:border-slate-700">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Dispute Settlement</h3>
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-8 leading-relaxed">
                            Log your refund request below. Verification will be processed by the vendor treasury.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Refund Allocation</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                                        max={order.total}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-cyan-500 dark:focus:border-cyan-500 outline-none font-black text-sm text-gray-900 dark:text-white"
                                    />
                                </div>
                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest">Max refundable: ${order.total.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Dispute Rationale</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:border-cyan-500 dark:focus:border-cyan-500 outline-none h-32 resize-none font-bold text-sm text-gray-900 dark:text-white"
                                    placeholder="Briefly explain the discrepancy..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setRefundModalOpen(false)}
                                className="flex-1 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                onClick={handleRefundRequest}
                                disabled={submittingRefund || !refundReason.trim()}
                                className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-cyan-900/40"
                            >
                                {submittingRefund ? 'Processing...' : 'Submit Claim'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
