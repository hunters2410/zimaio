import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
    TrendingUp,
    Download,
    FileText,
    Table as TableIcon,
    BarChart,
    LineChart,
    PieChart,
    Clock,
    ArrowUpRight,
    AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReportType {
    id: string;
    name: string;
    description: string;
    category: 'sales' | 'inventory' | 'customers' | 'vendors';
}

const REPORT_TYPES: ReportType[] = [
    { id: 'daily_sales', name: 'Daily Sales Report', description: 'Complete breakdown of sales for the last 24 hours.', category: 'sales' },
    { id: 'monthly_revenue', name: 'Monthly Revenue Summary', description: 'A high-level view of revenue trends by month.', category: 'sales' },
    { id: 'inventory_levels', name: 'Low Stock Alert Report', description: 'List of products with stock levels below threshold.', category: 'inventory' },
    { id: 'customer_growth', name: 'New Customer Registrations', description: 'Analysis of customer acquisition over time.', category: 'customers' },
    { id: 'vendor_payouts', name: 'Vendor Payout History', description: 'Status and history of all vendor commission payments.', category: 'vendors' },
    { id: 'top_products', name: 'Best Selling Products', description: 'Performance analysis of top 50 selling items.', category: 'sales' },
];

export function Reports() {
    const { formatPrice } = useCurrency();
    const [dateRange, setDateRange] = useState('7d');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'sales' | 'inventory' | 'customers' | 'vendors'>('all');
    const [generating, setGenerating] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        lowStock: 0,
        pendingPayouts: 0,
        pendingPayoutsCount: 0
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, [dateRange]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const now = new Date();
            let startDate = new Date();
            if (dateRange === '24h') startDate.setHours(now.getHours() - 24);
            else if (dateRange === '7d') startDate.setDate(now.getDate() - 7);
            else if (dateRange === '30d') startDate.setDate(now.getDate() - 30);
            else if (dateRange === '90d') startDate.setDate(now.getDate() - 90);

            // 1. Gross Revenue & Orders (Only paid orders)
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('total')
                .eq('payment_status', 'paid')
                .gte('created_at', startDate.toISOString());

            if (ordersError) throw ordersError;

            const revenue = ordersData?.reduce((sum, order) => sum + (Number(order.total) || 0), 0) || 0;
            const ordersCount = ordersData?.length || 0;

            // 2. Low Stock
            const { count: lowStockCount, error: stockError } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .lt('stock_quantity', 10)
                .eq('is_active', true);

            if (stockError) throw stockError;

            // 3. Pending Payouts (Assuming commissions table tracks this)
            const { data: payoutsData, error: payoutsError } = await supabase
                .from('commissions')
                .select('commission_amount')
                .eq('status', 'pending');

            if (payoutsError) {
                // If commissions table doesn't exist or has issues, fallback to 0
                console.warn('Commissions table check failed, might not be created yet:', payoutsError);
            }

            const pendingPayoutsTotal = payoutsData?.reduce((sum, item) => sum + (Number(item.commission_amount) || 0), 0) || 0;
            const pendingPayoutsCount = payoutsData?.length || 0;

            setStats({
                revenue,
                orders: ordersCount,
                lowStock: lowStockCount || 0,
                pendingPayouts: pendingPayoutsTotal,
                pendingPayoutsCount
            });

        } catch (err: any) {
            console.error('Error fetching report stats:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (reportId: string, format: 'pdf' | 'csv' = 'pdf') => {
        setGenerating(reportId);
        try {
            const now = new Date();
            let startDate = new Date();
            if (dateRange === '24h') startDate.setHours(now.getHours() - 24);
            else if (dateRange === '7d') startDate.setDate(now.getDate() - 7);
            else if (dateRange === '30d') startDate.setDate(now.getDate() - 30);
            else if (dateRange === '90d') startDate.setDate(now.getDate() - 90);

            let reportData: any[] = [];
            let title = "";

            if (reportId === 'daily_sales') {
                title = "Daily Sales Report";
                const { data } = await supabase.from('orders')
                    .select('order_number, total, status, payment_status, created_at')
                    .gte('created_at', startDate.toISOString())
                    .order('created_at', { ascending: false });
                reportData = data || [];
            } else if (reportId === 'monthly_revenue') {
                title = "Monthly Revenue Summary";
                const { data } = await supabase.from('orders')
                    .select('total, created_at')
                    .eq('payment_status', 'paid')
                    .gte('created_at', startDate.toISOString());
                reportData = data || [];
            } else if (reportId === 'inventory_levels') {
                title = "Low Stock Alert Report";
                const { data } = await supabase.from('products')
                    .select('name, stock_quantity, base_price')
                    .lt('stock_quantity', 10)
                    .eq('is_active', true);
                reportData = data || [];
            } else if (reportId === 'customer_growth') {
                title = "New Customer Registrations";
                const { data } = await supabase.from('profiles')
                    .select('full_name, email, created_at')
                    .eq('role', 'customer')
                    .gte('created_at', startDate.toISOString());
                reportData = data || [];
            } else if (reportId === 'vendor_payouts') {
                title = "Vendor Payout History";
                const { data } = await supabase.from('commissions')
                    .select('*, vendor:vendor_profiles(shop_name)')
                    .gte('created_at', startDate.toISOString());
                reportData = data || [];
            } else if (reportId === 'top_products') {
                title = "Best Selling Products";
                const { data } = await supabase.from('products')
                    .select('name, sales_count, base_price')
                    .order('sales_count', { ascending: false })
                    .limit(50);
                reportData = data || [];
            }

            if (format === 'csv') {
                if (reportData.length === 0) {
                    alert('No data available for this report and date range.');
                    return;
                }
                const headers = Object.keys(reportData[0]);
                const csvContent = [
                    headers.join(','),
                    ...reportData.map(row => headers.map(h => {
                        let val = row[h];
                        if (typeof val === 'object') val = JSON.stringify(val);
                        return `"${String(val).replace(/"/g, '""')}"`;
                    }).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${reportId}_${new Date().getTime()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // PDF Implementation
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                doc.setFillColor(79, 70, 229); // indigo-600
                doc.rect(0, 0, pageWidth, 40, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.text("ZimAIO Business Intelligence", 15, 20);
                doc.setFontSize(12);
                doc.text(title || reportId.toUpperCase(), 15, 30);

                doc.setTextColor(51, 65, 85);
                doc.setFontSize(10);
                doc.text(`Generation Date: ${new Date().toLocaleString()}`, 150, 20, { align: 'right' });
                doc.text(`Region: Zimbabwe / Global`, 150, 26, { align: 'right' });

                let y = 55;
                if (reportData.length === 0) {
                    doc.text("No data records found for the selected criteria.", 15, y);
                } else {
                    const headers = Object.keys(reportData[0]);

                    // Header Row
                    doc.setFontSize(9);
                    doc.setTextColor(100, 116, 139);
                    doc.setFont("helvetica", "bold");
                    headers.forEach((h, i) => {
                        doc.text(h.replace('_', ' ').toUpperCase(), 15 + (i * 35), y);
                    });

                    y += 5;
                    doc.setDrawColor(226, 232, 240);
                    doc.line(15, y, pageWidth - 15, y);
                    y += 8;

                    // Data Rows
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(51, 65, 85);
                    reportData.slice(0, 30).forEach((row) => {
                        headers.forEach((h, i) => {
                            let val = row[h];
                            if (val && typeof val === 'object' && val.shop_name) val = val.shop_name;
                            else if (typeof val === 'object') val = "Data";
                            doc.text(String(val).slice(0, 20), 15 + (i * 35), y);
                        });
                        y += 8;
                        if (y > 275) {
                            doc.addPage();
                            y = 20;
                        }
                    });
                }

                doc.save(`${reportId}_${new Date().getTime()}.pdf`);
            }
        } catch (err: any) {
            console.error('Export failed:', err);
            setError(`Export failed: ${err.message}`);
        } finally {
            setGenerating(null);
        }
    };

    const filteredReports = REPORT_TYPES.filter(r =>
        selectedCategory === 'all' || r.category === selectedCategory
    );

    const cardBg = 'bg-white';
    const textPrimary = 'text-slate-900';
    const textSecondary = 'text-slate-500';
    const borderColor = 'border-slate-200';

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className={`text-xl font-black uppercase tracking-tight ${textPrimary}`}>Reports & Analytics</h1>
                        <p className={`text-xs ${textSecondary} font-medium`}>Real-time business intelligence and data export</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 text-xs font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Clock className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-2">
                            <Download className="h-3 w-3" /> Export Dashboard
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-4 text-red-700">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider mb-1">Data Connection Error</p>
                            <p className="text-xs font-medium opacity-80">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Gross Revenue</span>
                            <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md"><TrendingUp className="h-3 w-3" /></span>
                        </div>
                        <div className={`text-2xl font-black ${textPrimary}`}>
                            {loading ? '...' : formatPrice(stats.revenue)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400">
                            <span className="text-emerald-600 flex items-center"><ArrowUpRight className="h-3 w-3" /> Paid</span> <span className="text-slate-300">|</span> last {dateRange}
                        </div>
                    </div>

                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Orders</span>
                            <span className="p-1 bg-blue-50 text-blue-600 rounded-md"><FileText className="h-3 w-3" /></span>
                        </div>
                        <div className={`text-2xl font-black ${textPrimary}`}>
                            {loading ? '...' : stats.orders}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-400">
                            <span className="text-blue-600 flex items-center"><ArrowUpRight className="h-3 w-3" /> Live</span> <span className="text-slate-300">|</span> last {dateRange}
                        </div>
                    </div>

                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Low Stock Items</span>
                            <span className="p-1 bg-amber-50 text-amber-600 rounded-md"><BarChart className="h-3 w-3" /></span>
                        </div>
                        <div className={`text-2xl font-black ${textPrimary}`}>
                            {loading ? '...' : stats.lowStock}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-600">
                            {stats.lowStock > 0 ? 'Restock Needed' : 'Healthy Levels'}
                        </div>
                    </div>

                    <div className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Pending Payouts</span>
                            <span className="p-1 bg-violet-50 text-violet-600 rounded-md"><PieChart className="h-3 w-3" /></span>
                        </div>
                        <div className={`text-2xl font-black ${textPrimary}`}>
                            {loading ? '...' : formatPrice(stats.pendingPayouts)}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-slate-500">
                            {stats.pendingPayoutsCount} commissions pending
                        </div>
                    </div>
                </div>

                <div className={`${cardBg} p-3 rounded-xl border ${borderColor} shadow-sm flex flex-col md:flex-row items-center justify-between gap-4`}>
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['all', 'sales', 'inventory', 'customers', 'vendors'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat as any)}
                                className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-all whitespace-nowrap ${selectedCategory === cat
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        {['24h', '7d', '30d', '90d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${dateRange === range
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredReports.map((report) => (
                        <div key={report.id} className={`${cardBg} p-4 rounded-xl border ${borderColor} shadow-sm group hover:border-indigo-500/30 transition-all`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${report.category === 'sales' ? 'bg-blue-50 text-blue-600' :
                                    report.category === 'inventory' ? 'bg-amber-50 text-amber-600' :
                                        report.category === 'customers' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-violet-50 text-violet-600'
                                    }`}>
                                    {report.category === 'sales' && <LineChart className="h-4 w-4" />}
                                    {report.category === 'inventory' && <BarChart className="h-4 w-4" />}
                                    {report.category === 'customers' && <PieChart className="h-4 w-4" />}
                                    {report.category === 'vendors' && <FileText className="h-4 w-4" />}
                                </div>
                                <h3 className={`text-sm font-bold ${textPrimary} truncate`}>{report.name}</h3>
                            </div>

                            <p className="text-[10px] text-slate-500 font-medium mb-4 h-8 leading-snug line-clamp-2">
                                {report.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 mt-auto">
                                <button
                                    onClick={() => handleDownload(report.id, 'pdf')}
                                    disabled={!!generating}
                                    className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    {generating === report.id ? <Clock className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                    PDF
                                </button>
                                <button
                                    onClick={() => handleDownload(report.id, 'csv')}
                                    disabled={!!generating}
                                    className="px-3 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <TableIcon className="h-3 w-3" />
                                    CSV
                                </button>
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </AdminLayout>
    );
}
