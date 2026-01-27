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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
                <Link to="/dashboard" className="text-cyan-600 hover:text-cyan-700 font-medium">
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <Link to="/dashboard" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    {/* Payment Success Banner */}
                    {location.search.includes('payment=success') && (
                        <div className="bg-emerald-50 text-emerald-800 px-6 py-3 text-sm font-medium border-b border-emerald-100 flex items-center gap-2">
                            <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            Payment successful! Your order is now being processed.
                        </div>
                    )}

                    <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                            </p>
                            {/* Tracking Number Display */}
                            {order.delivery_info?.tracking_number && (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm font-medium">
                                    <Truck className="w-4 h-4" />
                                    Tracking ID: <span className="font-mono tracking-wider text-blue-900">{order.delivery_info.tracking_number}</span>
                                </div>
                            )}
                        </div>
                        {order.status === 'delivered' && (
                            <button
                                onClick={() => setRefundModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Request Refund
                            </button>
                        )}
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Items Ordered</h3>
                            <div className="space-y-4">
                                {/* Assuming items is stored as JSONB array */}
                                {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="w-8 h-8 text-gray-400 m-auto" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price}</p>
                                        </div>
                                        <div className="font-bold text-gray-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Order Summary</h3>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">${order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Shipping</span>
                                        <span className="font-medium">$0.00</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-bold text-cyan-600">${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {order.shipping_address && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Shipping Details</h3>
                                    <div className="flex items-start gap-2 text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-lg">
                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                                        <div>
                                            <p>{(order.shipping_address as any).address}</p>
                                            <p>{(order.shipping_address as any).city}, {(order.shipping_address as any).country}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {order.delivery_info?.tracking_number && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Tracking Info</h3>
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-blue-600 font-medium">Tracking #</span>
                                            <span className="text-xs font-mono text-blue-800">{order.delivery_info.tracking_number}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-blue-600 font-medium">Status</span>
                                            <span className="text-xs uppercase font-bold text-blue-800">{order.delivery_info.status}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {refundModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Refund</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Please provide a reason for your refund request. The vendor will review your request.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                                        max={order.total}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Max refundable: ${order.total.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <textarea
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none h-24 resize-none"
                                    placeholder="e.g. Item defective, wrong size..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setRefundModalOpen(false)}
                                className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRefundRequest}
                                disabled={submittingRefund || !refundReason.trim()}
                                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingRefund ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
