import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Search,
    ChevronRight,
    ChevronLeft,
    X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Order {
    id: string;
    order_number: string;
    customer_id: string;
    vendor_id: string;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
    payment_method: string;
    shipping_address: any;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    } | null;
    vendor_profiles: {
        shop_name: string;
    } | null;
}

export function OrdersManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { formatPrice } = useCurrency();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const itemsPerPage = 10;

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, currentPage]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('orders')
                .select('*, profiles(full_name, email), vendor_profiles(shop_name)', { count: 'exact' });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (searchTerm) {
                query = query.or(`order_number.ilike.%${searchTerm}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setOrders(data || []);
            setTotalOrders(count || 0);
        } catch (error: any) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus as any });
            }
        } catch (error: any) {
            alert('Error updating status: ' + error.message);
        } finally {
            setUpdatingStatus(false);
        }
    };

    const fetchOrderItems = async (orderId: string) => {
        setLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select('*, products(name, images, sku)')
                .eq('order_id', orderId);

            if (error) throw error;
            setOrderItems(data || []);
        } catch (error: any) {
            console.error('Error fetching order items:', error);
        } finally {
            setLoadingItems(false);
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setShowDetails(true);
        fetchOrderItems(order.id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'shipped': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'refunded': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'failed': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'refunded': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Orders Management</h1>
                    <p className={textSecondary}>Monitor and manage all customer orders across the platform.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <h2 className="text-lg font-bold text-gray-900">{totalOrders}</h2>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Pending</p>
                    <h2 className="text-lg font-bold text-gray-900">
                        {orders.filter(o => o.status === 'pending').length}
                    </h2>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Delivered</p>
                    <h2 className="text-lg font-bold text-gray-900">
                        {orders.filter(o => o.status === 'delivered').length}
                    </h2>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <h2 className="text-lg font-bold text-gray-900">
                        {formatPrice(orders.reduce((acc, o) => acc + o.total, 0))}
                    </h2>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-2 rounded border border-gray-200 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                        <input
                            type="text"
                            placeholder="Order #..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-gray-200 focus:outline-none bg-white text-gray-900"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded border border-gray-200 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Order #</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Customer</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Shop</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Amount</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Status</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">Payment</th>
                                <th className="px-4 py-2 text-xs font-medium text-gray-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-4 py-2"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <span className="font-bold text-xs text-gray-900">{order.order_number}</span>
                                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <p className="text-xs text-gray-900">{order.profiles?.full_name || 'Walk-in'}</p>
                                        <p className="text-xs text-gray-500">{order.profiles?.email}</p>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <span className="text-xs text-gray-900">{order.vendor_profiles?.shop_name}</span>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <span className="text-xs font-bold text-gray-900">{formatPrice(order.total)}</span>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 border-r border-gray-200">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <button
                                            onClick={() => handleViewDetails(order)}
                                            className="px-2 py-1 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={`px-8 py-6 border-t ${borderColor} flex items-center justify-between`}>
                    <p className={`text-sm ${textSecondary} font-bold`}>
                        Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalOrders)}</span> of <span className="text-slate-900 dark:text-white">{totalOrders}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="px-4 py-2 font-black text-slate-900 dark:text-white">{currentPage}</span>
                        <button
                            disabled={currentPage * itemsPerPage >= totalOrders}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {showDetails && selectedOrder && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300 font-mono">
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200`}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white">
                                    Order Detail
                                </h2>
                                <p className="text-slate-400 font-bold uppercase text-[8px] tracking-widest mt-0.5"># {selectedOrder.order_number}</p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left side: Basic Info & Status */}
                                <div className="space-y-6">
                                    <section>
                                        <h3 className={`text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2`}>Status Control</h3>
                                        <div className="grid grid-cols-3 gap-1">
                                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                    disabled={updatingStatus || selectedOrder.status === s}
                                                    className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter border transition-all ${selectedOrder.status === s
                                                        ? 'bg-slate-900 border-slate-900 text-white'
                                                        : `bg-transparent border-slate-200 text-slate-400 hover:border-slate-900`
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <section className={`p-4 bg-white dark:bg-gray-900/40 rounded-xl border border-slate-200`}>
                                        <h3 className={`text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1`}>
                                            Buyer
                                        </h3>
                                        <div className="space-y-0.5">
                                            <p className={`text-xs font-black text-slate-900 dark:text-white uppercase`}>{selectedOrder.profiles?.full_name || 'Walk-in'}</p>
                                            <p className={`text-[10px] font-bold text-slate-500`}>{selectedOrder.profiles?.email}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
                                            <p className={`text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1`}>Shipping</p>
                                            <div className={`text-[10px] text-slate-600`}>
                                                {selectedOrder.shipping_address ? (
                                                    <pre className="whitespace-pre-wrap font-sans">
                                                        {typeof selectedOrder.shipping_address === 'string'
                                                            ? selectedOrder.shipping_address
                                                            : JSON.stringify(selectedOrder.shipping_address, null, 2)}
                                                    </pre>
                                                ) : 'Empty'}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right side: Payment & Summary */}
                                <div className="space-y-6">
                                    <section className={`p-4 bg-white dark:bg-gray-900/40 rounded-xl border border-slate-200`}>
                                        <h3 className={`text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2`}>
                                            Payment
                                        </h3>
                                        <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100">
                                            <span className={`text-[10px] font-bold text-slate-500`}>Method</span>
                                            <span className={`text-[10px] font-black text-slate-900 dark:text-white uppercase`}>{selectedOrder.payment_method}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100">
                                            <span className={`text-[10px] font-bold text-slate-500`}>Status</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                                                {selectedOrder.payment_status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-4">
                                            <span className={`text-xs font-black text-slate-400 uppercase`}>Total</span>
                                            <span className={`text-xl font-black text-slate-900 dark:text-white tracking-tighter`}>{formatPrice(selectedOrder.total)}</span>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="mt-8">
                            <h3 className={`text-[8px] font-black uppercase tracking-widest text-slate-400 mb-3`}>
                                Line Items
                            </h3>

                            {loadingItems ? (
                                <div className="flex justify-center py-6">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                                </div>
                            ) : (
                                <div className={`rounded-xl border border-slate-200 overflow-x-auto`}>
                                    <table className="w-full text-left font-mono">
                                        <thead>
                                            <tr className={`border-b border-slate-200 bg-slate-50`}>
                                                <th className={`px-3 py-1.5 text-[8px] font-black uppercase text-slate-400`}>Product</th>
                                                <th className={`px-3 py-1.5 text-[8px] font-black uppercase text-slate-400`}>Price</th>
                                                <th className={`px-3 py-1.5 text-[8px] font-black uppercase text-slate-400 text-right`}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {orderItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-1.5">
                                                        <div className="flex flex-col">
                                                            <span className={`text-[10px] font-black text-slate-900 uppercase`}>{item.products?.name}</span>
                                                            <span className={`text-[8px] text-slate-400`}>{item.products?.sku} x {item.quantity}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-1.5 text-[10px] text-slate-600">
                                                        {formatPrice(item.unit_price)}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right text-[10px] font-black text-slate-900">
                                                        {formatPrice(item.total_price)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                        <button
                            onClick={() => setShowDetails(false)}
                            className={`px-4 py-1.5 rounded-lg font-black uppercase text-[10px] border border-slate-200 text-slate-400 hover:bg-white transition`}
                        >
                            Close
                        </button>
                        <button
                            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-black uppercase text-[10px] shadow-sm hover:bg-slate-800 transition-all"
                        >
                            Invoice
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
