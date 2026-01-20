import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    ShoppingCart,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    Clock,
    ChevronDown,
    ExternalLink,
    MoreVertical,
    Calendar,
    User,
    MapPin,
    CreditCard,
    FileText
} from 'lucide-react';

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

interface Order {
    id: string;
    order_number: string;
    customer_id: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    items: OrderItem[];
    total: number;
    subtotal: number;
    shipping_fee: number;
    tax: number;
    currency_code: string;
    shipping_address: any;
    payment_status: string;
    payment_method: string;
    created_at: string;
    customer?: {
        full_name: string;
        email: string;
        phone: string;
    };
}

export function VendorOrderManagement() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (vendor) {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, customer:profiles(full_name, email, phone)')
                    .eq('vendor_id', vendor.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            }
        } catch (error: any) {
            console.error('Error fetching orders:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            if (selectedOrder?.id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
            }
            setMessage({ type: 'success', text: `Order status updated to ${newStatus}` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUpdating(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.customer?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'processing': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'shipped': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-3 h-3" />;
            case 'processing': return <Package className="w-3 h-3" />;
            case 'shipped': return <Truck className="w-3 h-3" />;
            case 'delivered': return <CheckCircle className="w-3 h-3" />;
            case 'cancelled': return <XCircle className="w-3 h-3" />;
            default: return <FileText className="w-3 h-3" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-gray-500 text-sm font-medium">Fetching your orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Order Management</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage and track all customer orders directed to your shop.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 transition-all active:scale-95"
                >
                    <Calendar className="w-4 h-4" />
                    Refresh List
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-8 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        <span className="text-sm font-medium">{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Orders Table */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <ShoppingCart className="w-8 h-8 text-gray-200" />
                                            </div>
                                            <p className="text-gray-400 text-sm font-medium">No orders found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/30 group transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 group-hover:text-emerald-600 transition-colors uppercase tabular-nums">#{order.order_number}</span>
                                                <span className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
                                                    {order.customer?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 uppercase text-[11px] tracking-tight">{order.customer?.full_name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-gray-400">{order.customer?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900">${order.total.toFixed(2)}</span>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{order.payment_status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">ORDER DETAIL</span>
                                    <h3 className="text-lg font-black text-gray-900 tabular-nums">#{selectedOrder.order_number}</h3>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                <XCircle className="w-6 h-6 text-gray-300" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="grid md:grid-cols-3 gap-8 text-sm font-medium">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <User className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Customer Information</h4>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                        <p className="font-black text-gray-900 uppercase">{selectedOrder.customer?.full_name}</p>
                                        <p className="text-gray-500 font-bold text-xs">{selectedOrder.customer?.email}</p>
                                        <p className="text-gray-500 font-bold text-xs">{selectedOrder.customer?.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <MapPin className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Shipping Address</h4>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-h-[100px] text-xs font-bold text-gray-600 space-y-1">
                                        <p className="text-gray-900 font-black">{selectedOrder.shipping_address?.full_name}</p>
                                        <p>{selectedOrder.shipping_address?.address_line1}</p>
                                        <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                                        <p>{selectedOrder.shipping_address?.country}, {selectedOrder.shipping_address?.zip_code}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CreditCard className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Payment & Status</h4>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Method:</span>
                                            <span className="font-black text-gray-900 uppercase text-[11px]">{selectedOrder.payment_method || 'Direct Payment'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Status:</span>
                                            <span className="font-black text-emerald-600 uppercase text-[11px]">{selectedOrder.payment_status}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Order:</span>
                                            <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Package className="w-4 h-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Order Items</h4>
                                </div>
                                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr className="text-left">
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 font-bold">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-300 m-2.5" />}
                                                            </div>
                                                            <span className="text-xs text-gray-900 uppercase line-clamp-1">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">${item.price.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-gray-600">x{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-gray-900 font-black tabular-nums">${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-gray-50/50">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</td>
                                                <td className="px-6 py-3 text-right font-black text-gray-900 tabular-nums">${selectedOrder.subtotal?.toFixed(2) || (selectedOrder.total - selectedOrder.shipping_fee).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipping</td>
                                                <td className="px-6 py-3 text-right font-black text-gray-900 tabular-nums">${selectedOrder.shipping_fee?.toFixed(2) || '0.00'}</td>
                                            </tr>
                                            <tr className="border-t border-gray-200">
                                                <td colSpan={3} className="px-6 py-4 text-right text-xs font-black text-gray-900 uppercase tracking-widest">Grand Total</td>
                                                <td className="px-6 py-4 text-right text-xl font-black text-emerald-600 tabular-nums">${selectedOrder.total.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 overflow-hidden">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Order Status:</span>
                                <div className="flex flex-wrap gap-2">
                                    {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                            disabled={updating || selectedOrder.status === status}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.status === status
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-600 hover:text-emerald-600 shadow-sm'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
                            >
                                Close Detail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
