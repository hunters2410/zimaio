import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { DollarSign, Filter, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RefundRequest {
  id: string;
  order_id: string;
  reason: string;
  amount: number;
  status: string;
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

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'processed';

export function RefundManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchRefunds();
  }, []);

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredRefunds(refunds);
    } else {
      setFilteredRefunds(refunds.filter(r => r.status === filterStatus));
    }
  }, [filterStatus, refunds]);

  const fetchRefunds = async () => {
    try {
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefunds(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (refundId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('order_refunds')
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
        })
        .eq('id', refundId);

      if (error) throw error;
      setMessage({ type: 'success', text: `Refund ${newStatus} successfully` });
      setSelectedRefund(null);
      setAdminNotes('');
      fetchRefunds();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      processed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    processed: refunds.filter(r => r.status === 'processed').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-cyan-600" />
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Refund Management</h1>
              <p className={`text-sm ${textSecondary}`}>Process and manage customer refunds</p>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Total Refunds</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Processed</p>
          <p className="text-2xl font-bold text-blue-600">{stats.processed}</p>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4 mb-4`}>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-cyan-600" />
          <span className={`text-sm font-medium ${textPrimary}`}>Filter by Status:</span>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'rejected', 'processed'] as FilterStatus[]).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-xs rounded transition ${filterStatus === status
                    ? 'bg-cyan-600 text-white'
                    : `${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${borderColor}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Order</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Customer</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Amount</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Reason</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Date</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRefunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <p className={`text-sm ${textSecondary}`}>No refunds found</p>
                  </td>
                </tr>
              ) : (
                filteredRefunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                      {refund.orders?.order_number || 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                      <div>
                        <p className="font-medium">{refund.profiles?.full_name || 'Unknown'}</p>
                        <p className={`text-xs ${textSecondary}`}>{refund.profiles?.email}</p>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold ${textPrimary}`}>
                      ${refund.amount.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm ${textSecondary} max-w-xs truncate`}>
                      {refund.reason}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSecondary}`}>
                      {new Date(refund.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setAdminNotes(refund.admin_notes || '');
                        }}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${textPrimary}`}>Manage Refund</h2>
              <button
                onClick={() => {
                  setSelectedRefund(null);
                  setAdminNotes('');
                }}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className={`text-xs ${textSecondary}`}>Order Number</p>
                <p className={`text-sm font-medium ${textPrimary}`}>{selectedRefund.orders?.order_number}</p>
              </div>

              <div>
                <p className={`text-xs ${textSecondary}`}>Refund Amount</p>
                <p className={`text-lg font-bold ${textPrimary}`}>${selectedRefund.amount.toFixed(2)}</p>
              </div>

              <div>
                <p className={`text-xs ${textSecondary} mb-1`}>Reason</p>
                <p className={`text-sm ${textPrimary}`}>{selectedRefund.reason}</p>
              </div>

              <div>
                <p className={`text-xs ${textSecondary}`}>Current Status</p>
                {getStatusBadge(selectedRefund.status)}
              </div>

              <div>
                <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this refund..."
                  className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                    }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                {selectedRefund.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedRefund.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedRefund.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
                {selectedRefund.status === 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedRefund.id, 'processed')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <DollarSign className="h-4 w-4" />
                    Mark as Processed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
