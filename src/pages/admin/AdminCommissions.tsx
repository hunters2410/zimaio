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
import { Pagination } from '../../components/Pagination';
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
    }, [statusFilter, currentPage, searchTerm]);

    // Reset page on filter/search
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    const fetchCommissions = async () => {
        setLoading(true);
        try {
            // Fetch from ORDERS table because that is the source of truth for handling fees now
            let query = supabase
                .from('orders')
                .select('*, vendor_profiles(shop_name)', { count: 'exact' })
                .gt('commission_amount', 0); // Only show orders with handling fees

            if (statusFilter !== 'all') {
                if (statusFilter === 'paid') query = query.eq('payment_status', 'paid');
                if (statusFilter === 'pending') query = query.neq('payment_status', 'paid');
            }

            if (searchTerm) {
                query = query.or(`id.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`);
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
                status: order.payment_status === 'paid' ? 'paid' : 'pending',
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
                    const isPaid = curr.payment_status === 'paid';
                    return isPaid ? acc + (curr.commission_amount || 0) : acc;
                }, 0);

                const pending = orders.reduce((acc, curr) => {
                    const isPaid = curr.payment_status === 'paid';
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className={`text-lg font-bold ${textPrimary} uppercase tracking-tight`}>Handling Fee Management</h1>
                        <p className={`text-xs ${textSecondary}`}>Monitor platform revenue from handling fees on vendor sales</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">+12.5%</span>
                        </div>
                        <p className={`text-[10px] font-bold ${textSecondary} uppercase tracking-wider mb-0.5`}>Total Handling Fees</p>
                        <h3 className={`text-xl font-bold ${textPrimary} tracking-tight`}>{formatPrice(stats.totalEarned)}</h3>
                    </div>

                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Wallet className="w-5 h-5 text-amber-500" />
                            </div>
                        </div>
                        <p className={`text-[10px] font-bold ${textSecondary} uppercase tracking-wider mb-0.5`}>Pending Payouts</p>
                        <h3 className={`text-xl font-bold ${textPrimary} tracking-tight`}>{formatPrice(stats.pendingAmount)}</h3>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden shadow-sm`}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/30 dark:bg-slate-900/10">
                        <div className="flex flex-wrap items-center gap-2">
                            {['all', 'pending', 'paid'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === status
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-gray-400 hover:text-emerald-600 border border-gray-100 dark:border-slate-700'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-700/50">
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Details</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Amount</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Handling Fee</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
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
                                        <tr key={comm.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors group border-b border-gray-50 dark:border-slate-700/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                                                        <FileText className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-bold ${textPrimary} group-hover:text-emerald-600 transition-colors`}>#{comm.orders?.order_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    <Store className="w-3.5 h-3.5 text-gray-400" />
                                                    {comm.vendor_profiles?.shop_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 font-mono">
                                                {formatPrice(comm.order_amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-emerald-600 font-mono">{formatPrice(comm.commission_amount)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Earned Fee</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${comm.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>
                                                    {comm.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-gray-400 tabular-nums">
                                                {new Date(comm.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 bg-gray-50/30 dark:bg-slate-900/10 border-t border-gray-100 dark:border-slate-700/50 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalComm}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
