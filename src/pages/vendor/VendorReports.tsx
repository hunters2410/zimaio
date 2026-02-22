import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    Package,
    ShoppingCart,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Download
} from 'lucide-react';

interface OrderReport {
    total: number;
    currency_code: string;
    created_at: string;
    items: any[];
}

interface StatCardProps {
    title: string;
    value: string;
    trend?: number;
    icon: React.ReactNode;
    color: string;
}

const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

function StatCard2({ title, value, trend, icon, color }: StatCardProps) {
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:translate-y-[-2px] transition-all">
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-0.5 text-[9px] font-black ${trend >= 0 ? 'text-green-600' : 'text-red-600'} uppercase tracking-widest`}>
                        {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

export function VendorReports() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('USD');
    const [timeRange, setTimeRange] = useState('30days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        growth: 12.5
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [topProducts, setTopProducts] = useState<any[]>([]);

    useEffect(() => {
        if (profile) fetchData();
    }, [profile, currency, timeRange, startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const vendor = (await supabase.from('vendor_profiles').select('id').eq('user_id', profile?.id).single()).data;
            if (!vendor) return;

            let finalStartDate: string;
            let finalEndDate = new Date().toISOString();

            if (timeRange === 'custom' && startDate && endDate) {
                finalStartDate = new Date(startDate).toISOString();
                finalEndDate = new Date(new Date(endDate).setHours(23, 59, 59)).toISOString();
            } else {
                let dateFilter = new Date();
                if (timeRange === '7days') dateFilter.setDate(dateFilter.getDate() - 7);
                else if (timeRange === '30days') dateFilter.setDate(dateFilter.getDate() - 30);
                else if (timeRange === '90days') dateFilter.setDate(dateFilter.getDate() - 90);
                finalStartDate = dateFilter.toISOString();
            }

            const { data, error } = await supabase
                .from('orders')
                .select('total, currency_code, created_at, items')
                .eq('vendor_id', vendor.id)
                .eq('currency_code', currency)
                .gte('created_at', finalStartDate)
                .lte('created_at', finalEndDate)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const resData = data as OrderReport[];

            // Process Stats
            const totalRev = resData.reduce((sum, order) => sum + Number(order.total), 0);
            setStats({
                totalRevenue: totalRev,
                totalOrders: resData.length,
                avgOrderValue: resData.length > 0 ? totalRev / resData.length : 0,
                growth: 12.5
            });

            // Process Chart Data (Daily Grouping)
            const dailyData: Record<string, number> = {};
            resData.forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dailyData[date] = (dailyData[date] || 0) + Number(order.total);
            });

            setChartData(Object.entries(dailyData).map(([date, total]) => ({ date, total })));

            // Process Top Products
            const productCounts: Record<string, { name: string, count: number, revenue: number }> = {};
            resData.forEach(order => {
                order.items.forEach((item: any) => {
                    const id = item.id || item.product_id;
                    if (!productCounts[id]) {
                        productCounts[id] = { name: item.name, count: 0, revenue: 0 };
                    }
                    productCounts[id].count += item.quantity || 1;
                    productCounts[id].revenue += (item.price || 0) * (item.quantity || 1);
                });
            });

            const topP = Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            setTopProducts(topP);

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Processing Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header & Filters */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Intelligence Center</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Advanced revenue & behavior analytics</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="bg-white p-1 rounded-xl border border-gray-100 flex gap-1 shadow-sm">
                        {['USD', 'ZWG', 'ZAR'].map((cur) => (
                            <button
                                key={cur}
                                onClick={() => setCurrency(cur)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${currency === cur ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                {cur}
                            </button>
                        ))}
                    </div>

                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="7days">7 Days</option>
                        <option value="30days">30 Days</option>
                        <option value="90days">90 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white px-3 py-2 rounded-xl border border-gray-100 text-[10px] font-bold outline-none ring-purple-500/20 focus:ring-2"
                            />
                            <span className="text-gray-400 font-black text-[10px]">TO</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white px-3 py-2 rounded-xl border border-gray-100 text-[10px] font-bold outline-none ring-purple-500/20 focus:ring-2"
                            />
                        </div>
                    )}

                    <button className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all active:scale-95 shadow-sm">
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard2
                    title="Gross Revenue"
                    value={`${currency === 'USD' ? '$' : currency} ${stats.totalRevenue.toLocaleString()}`}
                    trend={15.2}
                    icon={<DollarSign className="w-4 h-4 text-purple-600" />}
                    color="bg-purple-50"
                />
                <StatCard2
                    title="Volume"
                    value={stats.totalOrders.toString()}
                    trend={4.1}
                    icon={<ShoppingCart className="w-4 h-4 text-blue-600" />}
                    color="bg-blue-50"
                />
                <StatCard2
                    title="AOV"
                    value={`${currency === 'USD' ? '$' : currency} ${stats.avgOrderValue.toFixed(1)}`}
                    icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                    color="bg-green-50"
                />
                <StatCard2
                    title="Growth"
                    value="+12.5%"
                    icon={<Calendar className="w-4 h-4 text-amber-600" />}
                    color="bg-amber-50"
                />
            </div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Evolution */}
                <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Revenue Matrix</h3>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Growth performance trend</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Gross Sales</span>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94A3B8' }}
                                    tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900, fontSize: '10px' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Top Assets</h3>
                    <div className="space-y-4">
                        {topProducts.map((product, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-md shrink-0">
                                    #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-[11px] text-gray-900 uppercase tracking-tight truncate group-hover:text-purple-600 transition-colors">{product.name}</h4>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{product.count} Sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-[11px] text-gray-900">${product.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <div className="text-center py-10">
                                <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-[9px] font-bold text-gray-300 uppercase">No data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Revenue Mix</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topProducts}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="revenue"
                                    nameKey="name"
                                >
                                    {topProducts.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Export Intel</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest px-8 mt-1">Download raw transactional data for custom auditing.</p>
                    <button className="mt-6 mx-auto px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-700 transition shadow-md active:scale-95">
                        Download CSV Report
                    </button>
                </div>
            </div>
        </div>
    );
}
