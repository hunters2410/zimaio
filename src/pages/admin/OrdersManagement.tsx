import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    ShoppingCart,
    Search,
    CheckCircle,
    DollarSign,
    ChevronRight,
    ChevronLeft,
    X,
    Package,
    FileText,
    User,
    Store,
    Truck
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

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
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
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                                <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Orders Management</h1>
                        </div>
                        <p className={textSecondary}>Monitor and manage all customer orders across the platform.</p>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                            <Package className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Total Orders</span>
                    </div>
                    <h2 className={`text-3xl font-black ${textPrimary}`}>{totalOrders}</h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                            <Truck className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Pending</span>
                    </div>
                    <h2 className={`text-3xl font-black text-amber-600`}>
                        {orders.filter(o => o.status === 'pending').length}
                    </h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Delivered</span>
                    </div>
                    <h2 className={`text-3xl font-black text-emerald-600`}>
                        {orders.filter(o => o.status === 'delivered').length}
                    </h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <span className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Total Revenue</span>
                    </div>
                    <h2 className={`text-3xl font-black ${textPrimary}`}>
                        {formatPrice(orders.reduce((acc, o) => acc + o.total, 0))}
                    </h2>
                </div>
            </div>

            {/* Filters & Search */}
            <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm mb-8`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="relative flex-1">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSecondary} h-5 w-5`} />
                        <input
                            type="text"
                            placeholder="Search by order #..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
                            className={`w-full pl-12 pr-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 font-bold'}`}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={`px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
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
            <div className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden mb-8`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`border-b ${borderColor} bg-gray-50 dark:bg-gray-700/50`}>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Order #</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Customer</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Shop</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Amount</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Status</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Payment</th>
                                <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary} text-right`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : orders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className={`font-black font-mono text-sm ${textPrimary}`}>{order.order_number}</span>
                                        <p className={`text-[10px] font-bold ${textSecondary} mt-1`}>{new Date(order.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                                <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${textPrimary}`}>{order.profiles?.full_name || 'Walk-in Customer'}</p>
                                                <p className={`text-[10px] ${textSecondary}`}>{order.profiles?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-indigo-500" />
                                            <span className={`text-sm font-bold ${textPrimary}`}>{order.vendor_profiles?.shop_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`text-sm font-black ${textPrimary}`}>{formatPrice(order.total)}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPaymentStatusColor(order.payment_status)}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button
                                            onClick={() => handleViewDetails(order)}
                                            className="p-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all"
                                        >
                                            <ChevronRight className="h-5 w-5" />
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
                        Showing <span className={textPrimary}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={textPrimary}>{Math.min(currentPage * itemsPerPage, totalOrders)}</span> of <span className={textPrimary}>{totalOrders}</span> orders
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className={`px-4 py-2 font-black ${textPrimary}`}>{currentPage}</span>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className={`${cardBg} rounded-[48px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-emerald-600 text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <Package className="h-8 w-8" />
                                    Order Details
                                </h2>
                                <p className="text-white/70 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Order # {selectedOrder.order_number}</p>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left side: Basic Info & Status */}
                                <div className="space-y-8">
                                    <section>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-4`}>Order Status Control</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((s) => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                    disabled={updatingStatus || selectedOrder.status === s}
                                                    className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedOrder.status === s
                                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                                                        : `bg-transparent ${borderColor} ${textSecondary} hover:border-emerald-500`
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    <section className={`p-6 bg-slate-50 dark:bg-gray-900/40 rounded-[32px] border ${borderColor}`}>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-4 flex items-center gap-2`}>
                                            <User className="h-3 w-3" /> Customer Information
                                        </h3>
                                        <div className="space-y-1">
                                            <p className={`text-xl font-black ${textPrimary}`}>{selectedOrder.profiles?.full_name || 'Walk-in Customer'}</p>
                                            <p className={`text-sm font-bold text-indigo-500`}>{selectedOrder.profiles?.email}</p>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Shipping Address</p>
                                            <div className={`text-sm font-bold ${textPrimary}`}>
                                                {selectedOrder.shipping_address ? (
                                                    <pre className="whitespace-pre-wrap font-sans">
                                                        {typeof selectedOrder.shipping_address === 'string'
                                                            ? selectedOrder.shipping_address
                                                            : JSON.stringify(selectedOrder.shipping_address, null, 2)}
                                                    </pre>
                                                ) : 'No address provided'}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* Right side: Payment & Summary */}
                                <div className="space-y-8">
                                    <section className={`p-6 bg-slate-50 dark:bg-gray-900/40 rounded-[32px] border ${borderColor}`}>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-4 flex items-center gap-2`}>
                                            <DollarSign className="h-3 w-3" /> Financial Details
                                        </h3>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                            <span className={`text-sm font-bold ${textSecondary}`}>Payment Method</span>
                                            <span className={`text-sm font-black ${textPrimary} uppercase`}>{selectedOrder.payment_method}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                                            <span className={`text-sm font-bold ${textSecondary}`}>Payment Status</span>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                                                {selectedOrder.payment_status}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-6">
                                            <span className={`text-xl font-black ${textPrimary} uppercase tracking-tight`}>Total Amount</span>
                                            <span className={`text-3xl font-black text-emerald-600`}>{formatPrice(selectedOrder.total)}</span>
                                        </div>
                                    </section>

                                    <section className={`p-6 border-2 border-dashed ${borderColor} rounded-[32px]`}>
                                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-4 flex items-center gap-2`}>
                                            <FileText className="h-3 w-3" /> Internal Notes
                                        </h3>
                                        <p className={`text-sm font-medium ${textSecondary} italic`}>
                                            Order audit log and internal administrative notes would appear here.
                                        </p>
                                    </section>
                                </div>
                            </div>

                            {/* Order Items Table */}
                            <div className="mt-12">
                                <h3 className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-6 flex items-center gap-2`}>
                                    <Package className="h-4 w-4 text-emerald-600" /> Products in this Order
                                </h3>

                                {loadingItems ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                    </div>
                                ) : (
                                    <div className={`rounded-[32px] border ${borderColor} overflow-hidden`}>
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className={`border-b ${borderColor} bg-gray-50/50 dark:bg-gray-700/30`}>
                                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Product</th>
                                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>SKU</th>
                                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Price</th>
                                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Qty</th>
                                                    <th className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest ${textSecondary} text-right`}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {orderItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border ${borderColor} overflow-hidden flex-shrink-0">
                                                                    {item.products?.images?.[0] ? (
                                                                        <img src={item.products.images[0]} className="w-full h-full object-cover" alt="" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase">ZIM</div>
                                                                    )}
                                                                </div>
                                                                <span className={`text-sm font-bold ${textPrimary}`}>{item.products?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-[10px] font-mono font-bold ${textSecondary}`}>{item.products?.sku || 'N/A'}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-bold ${textPrimary}`}>{formatPrice(item.unit_price)}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`text-sm font-black ${textPrimary}`}>x{item.quantity}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`text-sm font-black text-emerald-600`}>{formatPrice(item.total_price)}</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-4">
                            <button
                                onClick={() => setShowDetails(false)}
                                className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border ${borderColor} ${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                            >
                                Close Details
                            </button>
                            <button
                                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
                            >
                                Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
