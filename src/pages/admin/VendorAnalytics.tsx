import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Filter,
    Search,
    Store,
    Star,
    Award,
    Zap,
    BarChart3,
    PieChart as PieChartIcon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface VendorStat {
    vendor_id: string;
    shop_name: string;
    total_sales: number;
    total_orders: number;
    rating: number;
    product_count: number;
    growth: number;
}

export function VendorAnalytics() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { formatPrice } = useCurrency();

    const [vendorStats, setVendorStats] = useState<VendorStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        // In a real app, this would be a complex query or an edge function
        // For now, we mock some data based on actual vendors
        try {
            const { data: vendors } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name');

            if (vendors) {
                const stats = vendors.map(v => ({
                    vendor_id: v.id,
                    shop_name: v.shop_name,
                    total_sales: Math.random() * 5000 + 1000,
                    total_orders: Math.floor(Math.random() * 100) + 10,
                    rating: 4 + Math.random(),
                    product_count: Math.floor(Math.random() * 50) + 5,
                    growth: (Math.random() * 40) - 10
                }));
                setVendorStats(stats);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = vendorStats.filter(s =>
        s.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.total_sales - a.total_sales);

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-2xl shadow-lg shadow-violet-100 dark:shadow-none">
                                <BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Vendor Analytics</h1>
                        </div>
                        <p className={textSecondary}>Deep dive into vendor performance, revenue trends, and growth metrics.</p>
                    </div>
                </div>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm relative overflow-hidden group`}>
                    <div className="relative z-10">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Top Revenue Vendor</p>
                        <h3 className={`text-2xl font-black ${textPrimary} truncate`}>{filteredStats[0]?.shop_name || 'N/A'}</h3>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-2xl font-black text-violet-600">{formatPrice(filteredStats[0]?.total_sales || 0)}</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center"><ArrowUpRight className="h-4 w-4" /> 24%</span>
                        </div>
                    </div>
                    <Store className="absolute -bottom-4 -right-4 h-24 w-24 text-gray-100 dark:text-gray-700/50 group-hover:scale-110 transition-transform" />
                </div>

                <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm group`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Avg. Vendor Rating</p>
                    <h3 className={`text-2xl font-black ${textPrimary}`}>
                        {(vendorStats.reduce((acc, s) => acc + s.rating, 0) / (vendorStats.length || 1)).toFixed(1)} / 5.0
                    </h3>
                    <div className="flex gap-1 mt-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                </div>

                <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Total Active Products</p>
                    <h3 className={`text-2xl font-black ${textPrimary}`}>
                        {vendorStats.reduce((acc, s) => acc + s.product_count, 0)}
                    </h3>
                    <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-violet-600 rounded-full w-[65%]" />
                    </div>
                </div>

                <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Sales Growth Index</p>
                    <h3 className={`text-2xl font-black text-emerald-500`}>+18.4%</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Performance: Outstanding</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Vendor Rankings */}
                <div className="lg:col-span-2">
                    <div className={`${cardBg} rounded-[48px] border ${borderColor} shadow-sm overflow-hidden`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className={`text-xl font-black uppercase tracking-tight ${textPrimary}`}>Vendor Performance Ranking</h3>
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${textSecondary}`} />
                                    <input
                                        type="text"
                                        placeholder="Search vendors..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`pl-10 pr-4 py-2 rounded-xl border ${borderColor} text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/10 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className={`border-b ${borderColor} bg-gray-50/50 dark:bg-gray-700/50`}>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Rank</th>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Vendor</th>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Total Sales</th>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Orders</th>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Growth</th>
                                        <th className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest ${textSecondary} text-right`}>Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={6} className="px-8 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-lg w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredStats.map((stat, index) => (
                                        <tr key={stat.vendor_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-8 py-6 font-black text-violet-600">#{index + 1}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600">
                                                        <Store className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-black ${textPrimary} uppercase tracking-tight`}>{stat.shop_name}</p>
                                                        <p className={`text-[10px] font-bold ${textSecondary}`}>{stat.product_count} Products</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-sm">{formatPrice(stat.total_sales)}</td>
                                            <td className="px-8 py-6 font-bold text-sm">{stat.total_orders}</td>
                                            <td className="px-8 py-6">
                                                <span className={`flex items-center gap-1 text-xs font-black ${stat.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {stat.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {Math.abs(stat.growth).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="inline-flex items-center justify-center p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 font-black text-xs">
                                                    {(stat.total_sales / 1000 + stat.rating).toFixed(1)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Insights & Highlights */}
                <div className="space-y-8">
                    <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm`}>
                        <h3 className={`text-xl font-black uppercase tracking-tighter ${textPrimary} mb-6`}>Top Performers</h3>
                        <div className="space-y-6">
                            {filteredStats.slice(0, 3).map((s, i) => (
                                <div key={s.vendor_id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 dark:bg-gray-900/40 relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 bg-amber-400 text-white rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center font-black text-violet-600">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className={`text-sm font-black ${textPrimary} truncate uppercase`}>{s.shop_name}</h4>
                                        <p className={`text-[10px] font-bold ${textSecondary}`}>Elite Badge Holder</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-violet-600">{formatPrice(s.total_sales)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-4 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-violet-600 hover:text-white transition-all">
                            View Full Report
                        </button>
                    </div>

                    <div className={`p-8 rounded-[48px] bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-2xl`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="h-6 w-6 fill-amber-400 text-amber-400" />
                            <h3 className="text-xl font-black uppercase tracking-tight">System Insight</h3>
                        </div>
                        <p className="text-sm font-medium leading-relaxed opacity-90">
                            Total platform revenue is up <span className="font-black text-amber-400">12.4%</span> since last week. Electronics remains the top category across all premium vendors.
                        </p>
                        <div className="mt-8 p-6 bg-white/10 rounded-[32px] border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Projected Growth</span>
                            <div className="flex items-end gap-2 mt-2">
                                <span className="text-3xl font-black">+22%</span>
                                <span className="text-xs opacity-70 pb-1">by next quarter</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
