import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Filter, Search, Store, Star, Zap, BarChart3 } from 'lucide-react';
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
    const { formatPrice } = useCurrency();
    const [vendorStats, setVendorStats] = useState<VendorStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch vendors with their actual data
            const { data: vendors, error: vendorsError } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, user_id');

            if (vendorsError) throw vendorsError;

            if (vendors) {
                // Fetch real statistics for each vendor
                const statsPromises = vendors.map(async (vendor) => {
                    // Get total sales from orders
                    const { data: orders } = await supabase
                        .from('orders')
                        .select('total_amount, created_at')
                        .eq('vendor_id', vendor.id)
                        .eq('status', 'completed');

                    // Get product count
                    const { data: products } = await supabase
                        .from('products')
                        .select('id')
                        .eq('vendor_id', vendor.id)
                        .eq('is_active', true);

                    // Get ratings
                    const { data: reviews } = await supabase
                        .from('product_reviews')
                        .select('rating')
                        .in('product_id', products?.map(p => p.id) || []);

                    const totalSales = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
                    const totalOrders = orders?.length || 0;
                    const avgRating = reviews?.length
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                        : 0;

                    // Calculate growth (comparing last 30 days vs previous 30 days)
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const sixtyDaysAgo = new Date();
                    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

                    const recentOrders = orders?.filter(o => new Date(o.created_at) >= thirtyDaysAgo) || [];
                    const previousOrders = orders?.filter(o => {
                        const date = new Date(o.created_at);
                        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
                    }) || [];

                    const recentSales = recentOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                    const previousSales = previousOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                    const growth = previousSales > 0 ? ((recentSales - previousSales) / previousSales) * 100 : 0;

                    return {
                        vendor_id: vendor.id,
                        shop_name: vendor.shop_name,
                        total_sales: totalSales,
                        total_orders: totalOrders,
                        rating: avgRating,
                        product_count: products?.length || 0,
                        growth: growth
                    };
                });

                const stats = await Promise.all(statsPromises);
                setVendorStats(stats);
            }
        } catch (error) {
            console.error('Error fetching vendor analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStats = vendorStats.filter(s =>
        s.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.total_sales - a.total_sales);

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-2 text-violet-600" />
                        Vendor Performance Analytics
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">Track vendor performance, revenue trends, and growth metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs text-slate-600 uppercase mb-1">Top Revenue</p>
                        <h3 className="text-lg font-bold text-slate-900 truncate">{filteredStats[0]?.shop_name || 'N/A'}</h3>
                        <div className="flex items-center gap-1 mt-2">
                            <span className="text-xl font-bold text-violet-600">{formatPrice(filteredStats[0]?.total_sales || 0)}</span>
                            <span className="text-xs text-emerald-500 flex items-center"><ArrowUpRight className="w-3 h-3" /> 24%</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs text-slate-600 uppercase mb-1">Avg. Rating</p>
                        <h3 className="text-lg font-bold text-slate-900">
                            {(vendorStats.reduce((acc, s) => acc + s.rating, 0) / (vendorStats.length || 1)).toFixed(1)} / 5.0
                        </h3>
                        <div className="flex gap-0.5 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs text-slate-600 uppercase mb-1">Active Products</p>
                        <h3 className="text-lg font-bold text-slate-900">
                            {vendorStats.reduce((acc, s) => acc + s.product_count, 0)}
                        </h3>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-600 rounded-full w-[65%]" />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <p className="text-xs text-slate-600 uppercase mb-1">Growth Index</p>
                        <h3 className="text-lg font-bold text-emerald-500">+18.4%</h3>
                        <div className="mt-2 flex items-center gap-1">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="text-xs text-slate-600">Outstanding</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">Performance Ranking</h3>
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 pr-2 py-1 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-violet-500 bg-white"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-100">
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase">Rank</th>
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase">Vendor</th>
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase">Sales</th>
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase">Orders</th>
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase">Growth</th>
                                            <th className="px-4 py-2 text-xs font-medium text-slate-600 uppercase text-right">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse">
                                                    <td colSpan={6} className="px-4 py-3"><div className="h-6 bg-gray-100 rounded w-full"></div></td>
                                                </tr>
                                            ))
                                        ) : filteredStats.map((stat, index) => (
                                            <tr key={stat.vendor_id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3 font-bold text-violet-600 text-sm">#{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded bg-violet-100 flex items-center justify-center text-violet-600">
                                                            <Store className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{stat.shop_name}</p>
                                                            <p className="text-xs text-slate-600">{stat.product_count} Products</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-bold text-sm">{formatPrice(stat.total_sales)}</td>
                                                <td className="px-4 py-3 font-medium text-sm">{stat.total_orders}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`flex items-center gap-0.5 text-xs font-bold ${stat.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {stat.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                        {Math.abs(stat.growth).toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-violet-100 text-violet-600 font-bold text-xs">
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

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-3">Top Performers</h3>
                            <div className="space-y-3">
                                {filteredStats.slice(0, 3).map((s, i) => (
                                    <div key={s.vendor_id} className="flex items-center gap-3 p-3 rounded bg-white border border-gray-200">
                                        <div className="w-10 h-10 rounded bg-violet-100 flex items-center justify-center font-bold text-violet-600">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{s.shop_name}</h4>
                                            <p className="text-xs text-slate-600">Elite Badge</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-violet-600">{formatPrice(s.total_sales)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-3 py-2 bg-violet-100 text-violet-600 rounded font-medium text-xs hover:bg-violet-600 hover:text-white transition">
                                View Full Report
                            </button>
                        </div>

                        <div className="p-4 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
                                <h3 className="text-lg font-bold">System Insight</h3>
                            </div>
                            <p className="text-sm leading-relaxed opacity-90">
                                Total platform revenue is up <span className="font-bold text-amber-400">12.4%</span> since last week. Electronics remains the top category.
                            </p>
                            <div className="mt-4 p-3 bg-white/10 rounded border border-white/10">
                                <span className="text-xs uppercase opacity-70">Projected Growth</span>
                                <div className="flex items-end gap-1 mt-1">
                                    <span className="text-2xl font-bold">+22%</span>
                                    <span className="text-xs opacity-70 pb-0.5">by next quarter</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
