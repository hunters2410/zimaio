import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, AlertTriangle, CheckCircle, XCircle, Search, Filter, Eye, Flag, ShieldCheck, Ban, UserX, MapPin, Clock, Activity, ArrowUpRight, ArrowDownRight, Shield, X } from 'lucide-react';

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
    const [alerts, setAlerts] = useState<FraudAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

    useEffect(() => {
        fetchAlerts();
    }, [filterStatus]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            let query = supabase.from('fraud_alerts').select('*, profiles(full_name, email)');
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
            const { error } = await supabase.from('fraud_alerts').update({ status: newStatus }).eq('id', alertId);
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
        if (score >= 80) return 'bg-rose-100';
        if (score >= 50) return 'bg-amber-100';
        return 'bg-emerald-100';
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <ShieldAlert className="w-6 h-6 mr-2 text-rose-600" />
                            Fraud & Risk Detection
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">Monitor suspicious activities and protect the marketplace</p>
                    </div>
                    <div className="px-3 py-1 rounded bg-gray-50 border border-gray-200 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-slate-600">Status: <span className="text-emerald-500">Secure</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Total Scanned</p>
                        <h2 className="text-2xl font-bold text-slate-900">14,208</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                            <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">High Risk</p>
                        <h2 className="text-2xl font-bold text-rose-600">{alerts.filter(a => a.risk_score > 80).length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Flag className="w-5 h-5 text-amber-600" />
                            <span className="text-xs font-medium text-amber-500">+12%</span>
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Pending</p>
                        <h2 className="text-2xl font-bold text-amber-600">{alerts.filter(a => a.status === 'pending').length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-500">100%</span>
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Resolved</p>
                        <h2 className="text-2xl font-bold text-emerald-600">{alerts.filter(a => a.status === 'resolved').length}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <Search className="w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="Search by user or reason..." className="bg-transparent border-none focus:ring-0 w-full text-sm" />
                            </div>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-transparent border-none focus:ring-0 text-xs font-medium text-slate-600">
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-gray-50 h-24 rounded animate-pulse border border-gray-200" />
                                ))
                            ) : alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    onClick={() => setSelectedAlert(alert)}
                                    className="bg-gray-50 p-4 rounded border border-gray-200 hover:shadow-md transition cursor-pointer flex items-center gap-4"
                                >
                                    <div className={`w-12 h-12 rounded flex flex-col items-center justify-center shrink-0 ${getRiskBg(alert.risk_score)}`}>
                                        <span className={`text-lg font-bold ${getRiskColor(alert.risk_score)}`}>{alert.risk_score}</span>
                                        <span className={`text-xs ${getRiskColor(alert.risk_score)}`}>Risk</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-bold text-slate-900">{alert.profiles?.full_name}</h4>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alert.status === 'pending' ? 'bg-amber-100 text-amber-700' : alert.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {alert.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-1">{alert.reason}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {new Date(alert.created_at).toLocaleString()}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {alert.metadata?.ip || 'Unknown IP'}
                                            </span>
                                        </div>
                                    </div>
                                    <Eye className="w-5 h-5 text-indigo-600 opacity-0 group-hover:opacity-100" />
                                </div>
                            ))}
                            {!loading && alerts.length === 0 && (
                                <div className="py-12 text-center flex flex-col items-center">
                                    <div className="p-4 bg-emerald-100 rounded mb-3">
                                        <ShieldCheck className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">No Security Threats</h3>
                                    <p className="text-sm text-slate-600">All systems operating normally</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
                            <h3 className="text-lg font-bold mb-3">Quick Security Actions</h3>
                            <div className="space-y-2">
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded font-medium text-xs transition flex items-center justify-center gap-2">
                                    <Ban className="w-4 h-4" /> Global IP Block
                                </button>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded font-medium text-xs transition flex items-center justify-center gap-2">
                                    <UserX className="w-4 h-4" /> Multi-Ban Users
                                </button>
                                <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded font-medium text-xs transition flex items-center justify-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Purge Risk Orders
                                </button>
                            </div>
                        </div>

                        {selectedAlert ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">Alert Details</h3>
                                    <button onClick={() => setSelectedAlert(null)}><X className="w-5 h-5 text-gray-400" /></button>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded flex items-center justify-center ${getRiskBg(selectedAlert.risk_score)}`}>
                                        <span className={`text-lg font-bold ${getRiskColor(selectedAlert.risk_score)}`}>{selectedAlert.risk_score}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">{selectedAlert.profiles?.full_name}</h4>
                                        <p className="text-xs text-slate-600">{selectedAlert.profiles?.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-3 bg-white rounded border border-gray-200">
                                        <span className="text-xs font-medium text-slate-600">Risk Analysis</span>
                                        <p className="text-sm font-medium text-slate-900 mt-1">{selectedAlert.reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <span className="text-xs font-medium text-slate-600">Device</span>
                                            <p className="text-xs font-bold text-slate-900 mt-1">{selectedAlert.metadata?.device || 'Mobile'}</p>
                                        </div>
                                        <div className="p-2 bg-white rounded border border-gray-200">
                                            <span className="text-xs font-medium text-slate-600">Browser</span>
                                            <p className="text-xs font-bold text-slate-900 mt-1">{selectedAlert.metadata?.browser || 'Chrome'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
                                        <button onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')} className="w-full py-2 bg-emerald-600 text-white rounded font-medium text-xs hover:bg-emerald-700 transition">
                                            Mark as Safe
                                        </button>
                                        <button onClick={() => handleUpdateStatus(selectedAlert.id, 'dismissed')} className="w-full py-2 bg-gray-200 text-gray-600 rounded font-medium text-xs hover:bg-gray-300 transition">
                                            Dismiss Alert
                                        </button>
                                        <button className="w-full py-2 bg-rose-600 text-white rounded font-medium text-xs hover:bg-rose-700 transition">
                                            Ban Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center text-center opacity-50">
                                <ShieldAlert className="w-10 h-10 text-gray-300 mb-2" />
                                <p className="text-xs font-medium text-slate-600">Select an alert<br />to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
