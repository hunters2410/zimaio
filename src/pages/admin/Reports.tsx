import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    TrendingUp,
    Download,
    FileText,
    Table as TableIcon,
    Search,
    Calendar,
    ChevronDown,
    Filter,
    BarChart,
    LineChart,
    PieChart,
    Clock,
    ArrowRight,
    Info
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

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
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [dateRange, setDateRange] = useState('7d');
    const [selectedCategory, setSelectedCategory] = useState<'all' | 'sales' | 'inventory' | 'customers' | 'vendors'>('all');
    const [generating, setGenerating] = useState<string | null>(null);

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    const handleDownload = (reportId: string) => {
        setGenerating(reportId);
        // Simulate generation
        setTimeout(() => {
            setGenerating(null);
            alert('Report generation started. Your download will begin shortly.');
        }, 1500);
    };

    const filteredReports = REPORT_TYPES.filter(r =>
        selectedCategory === 'all' || r.category === selectedCategory
    );

    return (
        <AdminLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                            <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Business Intelligence Reports</h1>
                    </div>
                    <p className={textSecondary}>Generate, analyze, and export comprehensive business data and performance reports.</p>
                </div>
            </div>

            {/* Global Filters */}
            <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm mb-10 flex flex-col lg:flex-row lg:items-center gap-8`}>
                <div className="flex-1">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3 ml-2`}>Time Frame</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['24h', '7d', '30d', '90d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${dateRange === range
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : `bg-slate-50 dark:bg-gray-700/50 ${textSecondary} hover:bg-slate-100`
                                    }`}
                            >
                                Last {range}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lg:w-px lg:h-12 bg-gray-100 dark:bg-gray-700" />
                <div className="flex-1">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3 ml-2`}>Filter by Category</label>
                    <div className="flex flex-wrap gap-3">
                        {['all', 'sales', 'inventory', 'customers', 'vendors'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat as any)}
                                className={`px-4 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${selectedCategory === cat
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 dark:shadow-none'
                                        : `bg-slate-50 dark:bg-gray-700/50 ${textSecondary} hover:bg-slate-100`
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredReports.map((report) => (
                    <div key={report.id} className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm group hover:shadow-2xl transition-all duration-500 flex flex-col`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 group-hover:scale-110 transition-transform">
                                {report.category === 'sales' && <LineChart className="h-8 w-8" />}
                                {report.category === 'inventory' && <BarChart className="h-8 w-8" />}
                                {report.category === 'customers' && <PieChart className="h-8 w-8" />}
                                {report.category === 'vendors' && <FileText className="h-8 w-8" />}
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-400 rounded-xl hover:text-indigo-600 transition-colors">
                                    <Info className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <h3 className={`text-2xl font-black ${textPrimary} uppercase tracking-tighter leading-tight mb-3`}>{report.name}</h3>
                        <p className={`text-sm ${textSecondary} font-medium mb-8 flex-1`}>{report.description}</p>

                        <div className="space-y-3 mt-auto">
                            <button
                                onClick={() => handleDownload(report.id)}
                                disabled={!!generating}
                                className="w-full py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {generating === report.id ? <Clock className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                {generating === report.id ? 'Generating...' : 'Export as PDF'}
                            </button>
                            <button
                                onClick={() => handleDownload(report.id)}
                                disabled={!!generating}
                                className={`w-full py-4 ${isDark ? 'bg-gray-700' : 'bg-slate-50'} ${textSecondary} rounded-[24px] font-black uppercase tracking-[0.15em] text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                            >
                                <TableIcon className="h-4 w-4" />
                                CSV Spreadsheet
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Analytics Insight Card */}
            <div className={`mt-12 p-10 rounded-[64px] bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-2xl relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <BarChart className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">AI Smart Analytics</h3>
                        </div>
                        <p className="text-lg font-medium opacity-90 leading-relaxed mb-8">
                            Our intelligence engine has identified a <span className="text-amber-400 font-black">15% increase</span> in mobile-web transactions this week. Consider optimizing the "Fast-Checkout" experience for better conversion.
                        </p>
                        <button className="px-10 py-5 bg-white text-indigo-600 rounded-[28px] font-black uppercase tracking-[0.2em] text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                            Deep Analysis Report <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="p-8 bg-white/10 rounded-[48px] backdrop-blur-xl border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Weekly Conversion</span>
                            <div className="text-4xl font-black mt-2">64.8%</div>
                            <div className="flex items-center gap-2 mt-2 text-emerald-400 font-bold">
                                <ArrowUpRight className="h-4 w-4" /> +4.2%
                            </div>
                        </div>
                        <div className="p-8 bg-white/10 rounded-[48px] backdrop-blur-xl border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Customer Retention</span>
                            <div className="text-4xl font-black mt-2">82.1%</div>
                            <div className="flex items-center gap-2 mt-2 text-emerald-400 font-bold">
                                <ArrowUpRight className="h-4 w-4" /> +1.8%
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
            </div>
        </AdminLayout>
    );
}
