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
    Calendar,
    User,
    MapPin,
    CreditCard,
    FileText,
    ExternalLink
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';

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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter, searchQuery]);

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
                let query = supabase
                    .from('orders')
                    .select('*, customer:profiles(full_name, email, phone)', { count: 'exact' })
                    .eq('vendor_id', vendor.id);

                if (statusFilter !== 'all') {
                    query = query.eq('status', statusFilter);
                }

                if (searchQuery) {
                    query = query.or(`order_number.ilike.%${searchQuery}%,profiles.full_name.ilike.%${searchQuery}%`);
                }

                const { data, error, count } = await query
                    .order('created_at', { ascending: false })
                    .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

                if (error) throw error;
                setOrders(data || []);
                setTotalItems(count || 0);
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
                .update({ status: newStatus })
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

    const filteredOrders = orders; // Now handled server-side

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50';
            case 'processing': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50';
            case 'shipped': return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50';
            case 'delivered': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50';
            case 'cancelled': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50';
            default: return 'bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 border-gray-100 dark:border-slate-600';
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
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Fetching your orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage and track all customer orders directed to your shop.</p>
                </div>
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                >
                    <Calendar className="w-4 h-4" />
                    Refresh List
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Customer Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-8 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
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
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                                                <ShoppingCart className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                            </div>
                                            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">No orders found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 group transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tabular-nums">#{order.order_number}</span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-xs uppercase">
                                                    {order.customer?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-tight">{order.customer?.full_name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{order.customer?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 dark:text-white tabular-nums">${order.total.toFixed(2)}</span>
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">{order.payment_status}</span>
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
                                                className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
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

            <div className="mt-4">
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">ORDER DETAIL</span>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white tabular-nums">#{selectedOrder.order_number}</h3>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-wider">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <XCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="grid md:grid-cols-3 gap-8 text-sm font-medium">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <User className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Customer Information</h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
                                        <p className="font-black text-slate-900 dark:text-white uppercase">{selectedOrder.customer?.full_name}</p>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">{selectedOrder.customer?.email}</p>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs">{selectedOrder.customer?.phone}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <MapPin className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Shipping Address</h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 min-h-[100px] text-xs font-bold text-slate-600 dark:text-slate-400 space-y-1">
                                        <p className="text-slate-900 dark:text-white font-black">{selectedOrder.shipping_address?.full_name}</p>
                                        <p>{selectedOrder.shipping_address?.address_line1}</p>
                                        <p>{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state}</p>
                                        <p>{selectedOrder.shipping_address?.country}, {selectedOrder.shipping_address?.zip_code}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm font-medium">
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <CreditCard className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Payment & Status</h4>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Method:</span>
                                            <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{selectedOrder.payment_method || 'Direct Payment'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Status:</span>
                                            <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase text-[11px]">{selectedOrder.payment_status}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Order:</span>
                                            <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusStyle(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4 text-sm font-medium">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <Package className="w-4 h-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Order Items</h4>
                                </div>
                                <div className="border border-slate-100 dark:border-slate-700 rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                                            <tr className="text-left">
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Qty</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700 font-bold">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0">
                                                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300 dark:text-slate-600 m-2.5" />}
                                                            </div>
                                                            <span className="text-xs text-slate-900 dark:text-slate-200 uppercase line-clamp-1">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">${item.price.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">x{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right text-slate-900 dark:text-white font-black tabular-nums">${(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50 dark:bg-slate-900/30">
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Subtotal</td>
                                                <td className="px-6 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">${selectedOrder.subtotal?.toFixed(2) || (selectedOrder.total - selectedOrder.shipping_fee).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shipping</td>
                                                <td className="px-6 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">${selectedOrder.shipping_fee?.toFixed(2) || '0.00'}</td>
                                            </tr>
                                            <tr className="border-t border-slate-200 dark:border-slate-700">
                                                <td colSpan={3} className="px-6 py-4 text-right text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Grand Total</td>
                                                <td className="px-6 py-4 text-right text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">${selectedOrder.total.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 overflow-hidden">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Update Order Status:</span>
                                <div className="flex flex-wrap gap-2">
                                    {['processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                                        <button
                                            key={status}
                                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                                            disabled={updating || selectedOrder.status === status}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.status === status
                                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-emerald-600 hover:text-emerald-600 shadow-sm'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="bg-slate-900 dark:bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95"
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
