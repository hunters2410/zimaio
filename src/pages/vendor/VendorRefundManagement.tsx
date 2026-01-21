import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    RotateCcw,
    Search,
    CheckCircle,
    XCircle
} from 'lucide-react';

type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

interface RefundRequest {
    id: string;
    order_id: string;
    reason: string;
    amount: number;
    status: RefundStatus;
    created_at: string;
    admin_notes?: string;
    orders: {
        order_number: string;
    };
    profiles: {
        full_name: string;
        email: string;
    };
}

export function VendorRefundManagement() {
    const { profile } = useAuth();
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchRefunds();
    }, [profile]);

    const fetchRefunds = async () => {
        if (!profile?.id) return;

        try {
            // Get vendor ID first
            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', profile.id)
                .single();

            if (!vendor) return;

            const { data, error } = await supabase
                .from('order_refunds')
                .select(`
          *,
          orders (
            order_number
          ),
          profiles:customer_id (
            full_name,
            email
          )
        `)
                .eq('vendor_id', vendor.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRefunds(data || []);
        } catch (error) {
            console.error('Error fetching refunds:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: RefundStatus) => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from('order_refunds')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setRefunds(prev => prev.map(r =>
                r.id === id ? { ...r, status: newStatus } : r
            ));
        } catch (error) {
            console.error('Error updating refund status:', error);
            alert('Failed to update refund status');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredRefunds = refunds.filter(refund => {
        const matchesFilter = filter === 'all' || refund.status === filter;
        const matchesSearch =
            refund.orders?.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refund.profiles?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            refund.profiles?.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status: RefundStatus) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'processed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'; // Treated same as approved for now
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Refund Management</h2>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Process and track customer refund requests.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search order or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Request Details</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRefunds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                                                <RotateCcw className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-bold">No refund requests found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRefunds.map((refund) => (
                                    <tr key={refund.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold shrink-0">
                                                    {refund.orders?.order_number.slice(-4) || '####'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-wide">#{refund.orders?.order_number}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(refund.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-900">{refund.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">{refund.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-medium text-gray-600 max-w-xs">{refund.reason}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-gray-900 tabular-nums">
                                                ${refund.amount.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(refund.status)}`}>
                                                {refund.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {refund.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(refund.id, 'approved')}
                                                            disabled={processingId === refund.id}
                                                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Approve Refund"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(refund.id, 'rejected')}
                                                            disabled={processingId === refund.id}
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Reject Refund"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                        {refund.status === 'approved' ? 'Completed' : 'Review Closed'}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
