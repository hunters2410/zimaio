import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { FileText, Filter, Download, Shield, AlertCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  currency_code: string;
  status: string;
  reference_id: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
}

export function TransactionLedger() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, filterStatus, filterDateFrom, filterDateTo, searchQuery]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transaction_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Filter by date range
    if (filterDateFrom) {
      filtered = filtered.filter(t => new Date(t.created_at) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.created_at) <= toDate);
    }

    // Search by reference ID or description
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.reference_id?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Status', 'Reference', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.transaction_type,
      t.amount,
      t.currency_code,
      t.status,
      t.reference_id || '',
      t.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      deposit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      withdrawal: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      payment: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
      refund: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      commission: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
    completed: filteredTransactions.filter(t => t.status === 'completed').length,
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
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
            <FileText className="h-6 w-6 text-cyan-600" />
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Transaction Ledger</h1>
              <p className={`text-sm ${textSecondary} flex items-center gap-1`}>
                <Shield className="h-3.5 w-3.5" />
                Immutable transaction history
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded hover:from-cyan-700 hover:to-green-700 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Total Transactions</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Total Volume</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>${stats.totalAmount.toFixed(2)}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-cyan-600" />
          <span className={`text-sm font-medium ${textPrimary}`}>Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ID, reference..."
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={resetFilters}
            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`border-b ${borderColor}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Date/Time</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Type</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Amount</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Status</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Reference</th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <p className={`text-sm ${textSecondary}`}>No transactions found</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className={`px-4 py-3 text-xs ${textSecondary}`}>
                      {new Date(transaction.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold ${textPrimary}`}>
                      {transaction.currency_code} {parseFloat(transaction.amount.toString()).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSecondary} font-mono`}>
                      {transaction.reference_id || 'N/A'}
                    </td>
                    <td className={`px-4 py-3 text-xs ${textSecondary} max-w-xs truncate`}>
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
