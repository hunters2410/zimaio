import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Search, Loader2, RefreshCw, Eye, Filter } from 'lucide-react';
import { Pagination } from '../../components/Pagination';

interface PaymentLog {
    id: string;
    order_id: string;
    transaction_id: string;
    gateway_type: string;
    status: string;
    log_data: any;
    created_at: string;
    orders?: {
        order_number: string;
    };
}

export function PaymentLogs() {
    const [logs, setLogs] = useState<PaymentLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [availableGateways, setAvailableGateways] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [gatewayFilter, setGatewayFilter] = useState('all');
    const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 20;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('payment_logs')
                .select(`
                    *,
                    orders (
                        order_number
                    )
                `, { count: 'exact' });

            if (searchTerm) {
                // Search across status, gateway, transaction_id, and order_number (via join)
                query = query.or(`status.ilike.%${searchTerm}%,gateway_type.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%,orders.order_number.ilike.%${searchTerm}%`);
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (gatewayFilter !== 'all') {
                query = query.eq('gateway_type', gatewayFilter);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setLogs(data || []);
            setTotalItems(count || 0);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            // If the join search fails (some Supabase versions/configs), fallback to simpler search
            if (error.message?.includes('orders')) {
                fetchLogsFallback();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchLogsFallback = async () => {
        let query = supabase
            .from('payment_logs')
            .select(`*, orders (order_number)`, { count: 'exact' });

        if (searchTerm) {
            query = query.or(`status.ilike.%${searchTerm}%,gateway_type.ilike.%${searchTerm}%,transaction_id.ilike.%${searchTerm}%`);
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        if (gatewayFilter !== 'all') {
            query = query.eq('gateway_type', gatewayFilter);
        }

        const { data, count } = await query
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        setLogs(data || []);
        setTotalItems(count || 0);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, gatewayFilter]);

    const fetchGateways = async () => {
        try {
            const { data } = await supabase.from('payment_gateways').select('gateway_type, display_name');
            if (data) {
                // Get unique gateway types
                const unique = Array.from(new Set(data.map(g => g.gateway_type)))
                    .map(type => {
                        const gateway = data.find(g => g.gateway_type === type);
                        return { type, name: gateway?.display_name || type };
                    });
                setAvailableGateways(unique);
            }
        } catch (error) {
            console.error('Error fetching gateways:', error);
        }
    };

    useEffect(() => {
        fetchGateways();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [currentPage, searchTerm, statusFilter, gatewayFilter]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Log copied to clipboard!');
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'success': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const filteredLogs = logs; // Now handled server-side (partially, search could be improved)

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-lg">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Payment Logs</h1>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Detailed gateway communications and security auditing trail.
                            </p>
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors text-xs font-semibold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                        <div className="relative col-span-1 md:col-span-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search order, transaction..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-200"
                        >
                            <option value="all">All Statuses</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select
                            value={gatewayFilter}
                            onChange={(e) => setGatewayFilter(e.target.value)}
                            className="px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-gray-700 dark:text-gray-200"
                        >
                            <option value="all">All Gateways</option>
                            {availableGateways.map(g => (
                                <option key={g.type} value={g.type}>{g.name}</option>
                            ))}
                            {/* Ensure iveri is at least manually there if not in table for some reason, though it should be */}
                            {!availableGateways.find(g => g.type === 'iveri') && (
                                <option value="iveri">iVeri</option>
                            )}
                        </select>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                            <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2 opacity-50" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">No records found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-700/50">
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Date</th>
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Order</th>
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Gateway</th>
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Amount</th>
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">Status</th>
                                        <th className="py-3 px-3 font-semibold text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider text-right">Info</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 dark:border-slate-700/30 hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-3 text-xs font-bold text-gray-900 dark:text-white">
                                                {log.orders?.order_number || 'N/A'}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-[10px] font-bold rounded uppercase tracking-wider">
                                                    {log.gateway_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs text-gray-900 dark:text-gray-100 font-bold">
                                                {(() => {
                                                    try {
                                                        const msg = typeof log.log_data.message === 'string'
                                                            ? JSON.parse(log.log_data.message)
                                                            : (log.log_data.message || log.log_data);
                                                        const currency = msg?.LITE_CURRENCY_ALPHACODE || 'USD';
                                                        const amount = parseInt(msg?.LITE_ORDER_AMOUNT || '0') / 100;
                                                        return `${currency} ${amount.toFixed(2)}`;
                                                    } catch (e) {
                                                        return 'USD 0.00';
                                                    }
                                                })()}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusStyle(log.status)}`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-6 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>

                {/* View Log Details Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50 dark:bg-slate-800">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Transaction Log Details</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Order: {selectedLog.orders?.order_number || selectedLog.order_id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => copyToClipboard(JSON.stringify(selectedLog.log_data, null, 2))}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
                                    >
                                        Copy Raw JSON
                                    </button>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 overflow-y-auto bg-slate-900 text-emerald-400 font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                                {JSON.stringify(selectedLog.log_data, null, 2)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
