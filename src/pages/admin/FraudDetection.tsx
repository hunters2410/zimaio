import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    ShieldAlert,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Eye,
    Flag,
    ShieldCheck,
    Ban,
    UserX,
    MapPin,
    Clock,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Shield
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FraudAlert {
    id: string;
    user_id: string;
    order_id?: string;
    risk_score: number;
    reason: string;
    status: 'pending' | 'resolved' | 'dismissed';
    metadata: any;
    created_at: string;
    profiles: {
        full_name: string;
        email: string;
    };
}

export function FraudDetection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [alerts, setAlerts] = useState<FraudAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchAlerts();
    }, [filterStatus]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('fraud_alerts')
                .select('*, profiles(full_name, email)');

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setAlerts(data || []);
        } catch (error: any) {
            console.error('Error fetching fraud alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (alertId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('fraud_alerts')
                .update({ status: newStatus })
                .eq('id', alertId);

            if (error) throw error;
            fetchAlerts();
            setSelectedAlert(null);
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 80) return 'text-rose-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-emerald-600';
    };

    const getRiskBg = (score: number) => {
        if (score >= 80) return 'bg-rose-50 dark:bg-rose-900/20';
        if (score >= 50) return 'bg-amber-50 dark:bg-amber-900/20';
        return 'bg-emerald-50 dark:bg-emerald-900/20';
    };

    return (
        <AdminLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl shadow-lg shadow-rose-100 dark:shadow-none">
                            <ShieldAlert className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Fraud & Risk Detection</h1>
                    </div>
                    <p className={textSecondary}>Monitor suspicious activities and protect the marketplace from fraud.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-2xl ${cardBg} border ${borderColor} flex items-center gap-2`}>
                        <Activity className="h-4 w-4 text-emerald-500" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>System Status: <span className="text-emerald-500">Secure</span></span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`${cardBg} p-8 rounded-[40px] border ${borderColor} shadow-sm group hover:scale-[1.02] transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                            <Shield className="h-6 w-6" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Total Scanned</p>
                    <h2 className={`text-3xl font-black ${textPrimary} mt-1`}>14,208</h2>
                </div>
                <div className={`${cardBg} p-8 rounded-[40px] border ${borderColor} shadow-sm group hover:scale-[1.02] transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <ArrowDownRight className="h-5 w-5 text-rose-500" />
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>High Risk Alerts</p>
                    <h2 className={`text-3xl font-black text-rose-600 mt-1`}>{alerts.filter(a => a.risk_score > 80).length}</h2>
                </div>
                <div className={`${cardBg} p-8 rounded-[40px] border ${borderColor} shadow-sm group hover:scale-[1.02] transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                            <Flag className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-amber-500">+12%</span>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Pending Review</p>
                    <h2 className={`text-3xl font-black text-amber-600 mt-1`}>{alerts.filter(a => a.status === 'pending').length}</h2>
                </div>
                <div className={`${cardBg} p-8 rounded-[40px] border ${borderColor} shadow-sm group hover:scale-[1.02] transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500">100%</span>
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Resolved</p>
                    <h2 className={`text-3xl font-black text-emerald-600 mt-1`}>{alerts.filter(a => a.status === 'resolved').length}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`${cardBg} p-6 rounded-[40px] border ${borderColor} shadow-sm flex items-center justify-between`}>
                        <div className="flex items-center gap-4 flex-1">
                            <Search className={`h-5 w-5 ${textSecondary}`} />
                            <input
                                type="text"
                                placeholder="Search by user or reason..."
                                className={`bg-transparent border-none focus:ring-0 w-full font-bold ${textPrimary}`}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className={`bg-transparent border-none focus:ring-0 font-black uppercase text-[10px] tracking-widest ${textSecondary}`}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                        </select>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={`${cardBg} h-32 rounded-[32px] animate-pulse border ${borderColor}`} />
                            ))
                        ) : alerts.map((alert) => (
                            <div
                                key={alert.id}
                                onClick={() => setSelectedAlert(alert)}
                                className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center gap-6`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${getRiskBg(alert.risk_score)}`}>
                                    <span className={`text-xl font-black ${getRiskColor(alert.risk_score)}`}>{alert.risk_score}</span>
                                    <span className={`text-[8px] font-black uppercase tracking-tighter ${getRiskColor(alert.risk_score)} opacity-70`}>Score</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className={`text-lg font-black ${textPrimary} uppercase tracking-tight`}>{alert.profiles?.full_name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${alert.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {alert.status}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${textSecondary} line-clamp-1`}>{alert.reason}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className={`text-[10px] font-bold ${textSecondary} flex items-center gap-1`}>
                                            <Clock className="h-3 w-3" /> {new Date(alert.created_at).toLocaleString()}
                                        </span>
                                        <span className={`text-[10px] font-bold ${textSecondary} flex items-center gap-1`}>
                                            <MapPin className="h-3 w-3" /> {alert.metadata?.ip || 'Unknown IP'}
                                        </span>
                                    </div>
                                </div>
                                <button className={`p-3 rounded-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all`}>
                                    <Eye className="h-6 w-6" />
                                </button>
                            </div>
                        ))}
                        {!loading && alerts.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[40px] mb-4">
                                    <ShieldCheck className="h-12 w-12 text-emerald-600" />
                                </div>
                                <h3 className={`text-xl font-black uppercase ${textPrimary}`}>No Security Threats</h3>
                                <p className={textSecondary}>All systems are operating normally.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className={`p-8 rounded-[48px] bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl relative overflow-hidden`}>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Quick Security Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-[24px] font-black uppercase tracking-[0.1em] text-xs transition-all flex items-center justify-center gap-3">
                                    <Ban className="h-4 w-4" /> Global IP Blockhouse
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-[24px] font-black uppercase tracking-[0.1em] text-xs transition-all flex items-center justify-center gap-3">
                                    <UserX className="h-4 w-4" /> Multi-Ban Users
                                </button>
                                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-[24px] font-black uppercase tracking-[0.1em] text-xs transition-all flex items-center justify-center gap-3">
                                    <AlertTriangle className="h-4 w-4" /> Purge Risk Orders
                                </button>
                            </div>
                        </div>
                        <Shield className="absolute -bottom-10 -right-10 h-40 w-40 text-white/5 rotate-12" />
                    </div>

                    {selectedAlert ? (
                        <div className={`${cardBg} p-8 rounded-[48px] border ${borderColor} shadow-sm animate-in fade-in slide-in-from-right-4`}>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className={`text-xl font-black uppercase tracking-tight ${textPrimary}`}>Alert Details</h3>
                                <button onClick={() => setSelectedAlert(null)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${getRiskBg(selectedAlert.risk_score)}`}>
                                    <span className={`text-xl font-black ${getRiskColor(selectedAlert.risk_score)}`}>{selectedAlert.risk_score}</span>
                                </div>
                                <div>
                                    <h4 className={`text-lg font-black ${textPrimary}`}>{selectedAlert.profiles?.full_name}</h4>
                                    <p className={`text-xs ${textSecondary} font-bold`}>{selectedAlert.profiles?.email}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 dark:bg-gray-900/40 rounded-[32px]">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Risk Analysis</span>
                                    <p className={`text-sm font-bold ${textPrimary} mt-2`}>{selectedAlert.reason}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 dark:bg-gray-900/40 rounded-[24px]">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Device</span>
                                        <p className={`text-xs font-black ${textPrimary} mt-1`}>{selectedAlert.metadata?.device || 'Mobile'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 dark:bg-gray-900/40 rounded-[24px]">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Browser</span>
                                        <p className={`text-xs font-black ${textPrimary} mt-1`}>{selectedAlert.metadata?.browser || 'Chrome'}</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Mark as Safe
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedAlert.id, 'dismissed')}
                                        className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                                    >
                                        Dismiss Alert
                                    </button>
                                    <button
                                        className="w-full py-4 bg-rose-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Ban Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`${cardBg} p-10 rounded-[48px] border-4 border-dashed ${borderColor} flex flex-col items-center justify-center text-center opacity-50`}>
                            <ShieldAlert className="h-12 w-12 text-gray-300 mb-4" />
                            <p className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Select an alert<br />to view deep analysis</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
