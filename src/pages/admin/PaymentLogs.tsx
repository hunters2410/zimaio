import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, Search, Loader2, RefreshCw, Eye } from 'lucide-react';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payment_logs')
                .select(`
                    *,
                    orders (
                        order_number
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

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

    const filteredLogs = logs.filter(log =>
        log.gateway_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.orders?.order_number && log.orders.order_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-xl">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Compliance Logs</h2>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400">
                                Track detailed trace parameters, 3DS metrics, and gateway communications for security auditing.
                            </p>
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-medium"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Gateway, or Status..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                            <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No payment logs recorded yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-700">
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Date</th>
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Order ID</th>
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Gateway</th>
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Amount</th>
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm">Status</th>
                                        <th className="py-4 px-4 font-semibold text-gray-600 dark:text-gray-300 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                {log.orders?.order_number || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full uppercase tracking-wider">
                                                    {log.gateway_type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 font-medium">
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
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(log.status)}`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* View Log Details Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
