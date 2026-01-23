import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Search,
    ArrowUpRight,
    Wallet,
    TrendingUp,
    Store,
    ChevronRight,
    ChevronLeft,
    FileText
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface Commission {
    id: string;
    order_id: string;
    vendor_id: string;
    order_amount: number;
    commission_rate: number;
    commission_amount: number;
    status: string;
    paid_at: string;
    created_at: string;
    orders: {
        order_number: string;
    };
    vendor_profiles: {
        shop_name: string;
    };
}

export function AdminCommissions() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { formatPrice } = useCurrency();

    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalComm, setTotalComm] = useState(0);
    const itemsPerPage = 10;

    const [stats, setStats] = useState({
        totalEarned: 0,
        pendingAmount: 0,
        monthlyGrowth: 0,
        topVendor: 'N/A'
    });

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchCommissions();
        fetchStats();
    }, [statusFilter, currentPage]);

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            // Fetch from ORDERS table because that is the source of truth for handling fees now
            let query = supabase
                .from('orders')
                .select('*, vendor_profiles(shop_name)', { count: 'exact' })
                .gt('commission_amount', 0); // Only show orders with handling fees

            if (statusFilter !== 'all') {
                if (statusFilter === 'paid') query = query.or('payment_status.eq.paid,payment_status.eq.completed');
                if (statusFilter === 'pending') query = query.neq('payment_status', 'paid').neq('payment_status', 'completed');
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;

            // Map orders to Commission interface shape for compatibility
            const mappedData = (data || []).map(order => ({
                id: order.id,
                order_id: order.id,
                vendor_id: order.vendor_id,
                order_amount: order.subtotal + order.commission_amount, // Approximate total
                commission_rate: 0, // We can calculate or leave 0, handling fee is absolute
                commission_amount: order.commission_amount,
                status: (order.payment_status === 'paid' || order.payment_status === 'completed') ? 'paid' : 'pending',
                paid_at: order.created_at, // Approximate
                created_at: order.created_at,
                orders: { order_number: order.id.substring(0, 8).toUpperCase() }, // Mock number
                vendor_profiles: { shop_name: order.vendor_profiles?.shop_name || 'N/A' }
            }));

            setCommissions(mappedData as any);
            setTotalComm(count || 0);
        } catch (error) {
            console.error('Error fetching commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data: orders } = await supabase
                .from('orders')
                .select('commission_amount, payment_status');

            if (orders) {
                const total = orders.reduce((acc, curr) => {
                    const isPaid = curr.payment_status === 'paid' || curr.payment_status === 'completed';
                    return isPaid ? acc + (curr.commission_amount || 0) : acc;
                }, 0);

                const pending = orders.reduce((acc, curr) => {
                    const isPaid = curr.payment_status === 'paid' || curr.payment_status === 'completed';
                    return !isPaid ? acc + (curr.commission_amount || 0) : acc;
                }, 0);

                setStats(prev => ({
                    ...prev,
                    totalEarned: total,
                    pendingAmount: pending
                }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-black ${textPrimary} uppercase tracking-tighter`}>Handling Fee Management</h1>
                        <p className={textSecondary}>Monitor and oversee platform revenue from handling fees on vendor sales</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className={`${cardBg} p-6 rounded-[2.5rem] border ${borderColor} shadow-xl shadow-emerald-500/5`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-emerald-500" />
                            </div>
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-xs font-black">+12.5%</span>
                        </div>
                        <p className={`text-xs font-black ${textSecondary} uppercase tracking-widest mb-1`}>Total Handling Fees</p>
                        <h3 className={`text-3xl font-black ${textPrimary} tracking-tight`}>{formatPrice(stats.totalEarned)}</h3>
                    </div>

                    <div className={`${cardBg} p-6 rounded-[2.5rem] border ${borderColor} shadow-xl shadow-amber-500/5`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <Wallet className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                        <p className={`text-xs font-black ${textSecondary} uppercase tracking-widest mb-1`}>Pending Payouts</p>
                        <h3 className={`text-3xl font-black ${textPrimary} tracking-tight`}>{formatPrice(stats.pendingAmount)}</h3>
                    </div>

                </div>

                {/* Filters & Table */}
                <div className={`${cardBg} rounded-[2.5rem] border ${borderColor} overflow-hidden shadow-2xl shadow-gray-950/5`}>
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/50">
                        <div className="flex flex-wrap items-center gap-3">
                            {['all', 'pending', 'paid'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                        : 'bg-white text-gray-400 hover:text-emerald-600 border border-gray-100'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Details</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Amount</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Handling Fee</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Processing revenue data...</p>
                                        </td>
                                    </tr>
                                ) : (
                                    commissions.map((comm) => (
                                        <tr key={comm.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-black ${textPrimary} group-hover:text-emerald-600 transition-colors`}>#{comm.orders?.order_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                                    <Store className="w-4 h-4 text-gray-400" />
                                                    {comm.vendor_profiles?.shop_name}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-black text-gray-600 font-mono">
                                                {formatPrice(comm.order_amount)}
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rate: {comm.commission_rate}%</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-black text-emerald-600 font-mono">{formatPrice(comm.commission_amount)}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">(Earned Fee)</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${comm.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-sm font-bold text-gray-400 tabular-nums">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            Showing {commissions.length} of {totalComm} commission entries
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage * itemsPerPage >= totalComm}
                                className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
