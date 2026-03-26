import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { FileText, Filter, Download, Shield, AlertCircle, X, ArrowUpRight, ArrowDownLeft, Clock, Search, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Pagination } from '../../components/Pagination';

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
  profiles?: {
    full_name: string | null;
    email: string | null;
  }
}

export function TransactionLedger() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 15;

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filterType, filterStatus, filterDateFrom, filterDateTo, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, filterDateFrom, filterDateTo, searchQuery]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transaction_ledger')
        .select(`
          *,
          profiles:user_id (full_name, email)
        `, { count: 'exact' });

      if (filterType !== 'all') {
        query = query.eq('transaction_type', filterType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterDateFrom) {
        query = query.gte('created_at', filterDateFrom);
      }

      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }

      if (searchQuery) {
        query = query.or(`reference_id.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,id.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setTransactions(data || []);
      setTotalItems(count || 0);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Type', 'Amount', 'Currency', 'Status', 'Reference', 'Description'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.profiles?.full_name || 'N/A',
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
    a.download = `ledger-export-${new Date().toISOString().split('T')[0]}.csv`;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowUpRight className="h-3 w-3 text-green-500" />;
      case 'withdrawal': return <ArrowDownLeft className="h-3 w-3 text-red-500" />;
      case 'commission': return <Shield className="h-3 w-3 text-cyan-500" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const totalInbound = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOutbound = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${textPrimary} tracking-tight uppercase`}>Immutable Fiscal Ledger</h1>
              <p className={`text-[10px] font-black ${textSecondary} flex items-center gap-1 uppercase tracking-widest`}>
                <Shield className="h-3 w-3 text-cyan-600" />
                Verified cryptographic transaction log
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition shadow-sm font-black text-[10px] uppercase tracking-widest"
          >
            <Download className="h-3.5 w-3.5" />
            Export Data
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border-2 flex items-center justify-between animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Board */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBg} rounded-2xl p-4 border ${borderColor} shadow-sm`}>
          <p className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest mb-1`}>Total Entries</p>
          <p className={`text-2xl font-black ${textPrimary}`}>{totalItems.toLocaleString()}</p>
        </div>
        <div className={`${cardBg} rounded-2xl p-4 border ${borderColor} shadow-sm`}>
          <p className={`text-[9px] font-black text-green-600 uppercase tracking-widest mb-1`}>Inbound Velocity</p>
          <div className="flex items-center gap-2">
             <p className={`text-xl font-black ${textPrimary}`}>+${totalInbound.toFixed(2)}</p>
             <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
        </div>
        <div className={`${cardBg} rounded-2xl p-4 border ${borderColor} shadow-sm`}>
          <p className={`text-[9px] font-black text-red-600 uppercase tracking-widest mb-1`}>Outbound Drain</p>
          <div className="flex items-center gap-2">
             <p className={`text-xl font-black ${textPrimary}`}>-${totalOutbound.toFixed(2)}</p>
             <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </div>
        </div>
        <div className={`${cardBg} rounded-2xl p-4 border ${borderColor} shadow-sm bg-gradient-to-br from-indigo-600/5 to-transparent`}>
          <p className={`text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1`}>Net Delta (Page)</p>
          <p className={`text-xl font-black text-indigo-600`}>${(totalInbound - totalOutbound).toFixed(2)}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className={`${cardBg} rounded-2xl shadow-sm border ${borderColor} p-4 mb-6`}>
        <div className="flex items-center gap-2 mb-4 border-b ${borderColor} pb-2 text-indigo-600">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Master Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className={`block text-[9px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Protocol Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="payment">Order Payment</option>
              <option value="commission">Commission</option>
              <option value="adjustment">Manual Adjustment</option>
            </select>
          </div>

          <div>
            <label className={`block text-[9px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Verification Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
            >
              <option value="all">Any Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className={`block text-[9px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Range Start</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
            />
          </div>

          <div>
            <label className={`block text-[9px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Range End</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={`w-full px-3 py-2 text-xs font-bold border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
            />
          </div>

          <div>
            <label className={`block text-[9px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Deep Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID or Ref..."
                className={`w-full pl-9 pr-3 py-2 text-xs font-bold border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={resetFilters}
            className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-[0.2em]"
          >
            Clear All Constraints
          </button>
        </div>
      </div>

      <div className={`${cardBg} rounded-2xl shadow-xl border ${borderColor} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b ${borderColor}">
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Timestamp</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Origin / Identity</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Protocol Type</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Master Amount</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Audit Status</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Ref Code</th>
                <th className={`px-4 py-4 text-[9px] font-black ${textSecondary} uppercase tracking-[0.2em]`}>Documentation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                   <td colSpan={7} className="px-4 py-20 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                   </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-20 text-center">
                    <AlertCircle className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                    <p className={`text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>No ledger entries matching current constraints.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition">
                    <td className={`px-4 py-4 whitespace-nowrap text-[9px] font-bold ${textSecondary} uppercase tabular-nums`}>
                      <div className="flex flex-col">
                         <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                         <span className="opacity-50">{new Date(transaction.created_at).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-500">
                            {transaction.profiles?.full_name?.charAt(0) || '?'}
                         </div>
                         <div className="flex flex-col">
                            <span className={`text-[10px] font-black ${textPrimary} tracking-tight`}>{transaction.profiles?.full_name || 'System Auto'}</span>
                            <span className="text-[8px] font-bold text-gray-400 opacity-70">{transaction.profiles?.email || 'automated@zim.io'}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.transaction_type)}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${textPrimary}`}>
                          {transaction.transaction_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-xs font-black ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-500'} tabular-nums`}>
                        {Number(transaction.amount) >= 0 ? '+' : ''}{Number(transaction.amount).toFixed(2)} {transaction.currency_code}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`px-4 py-4 whitespace-nowrap text-[9px] font-bold ${textSecondary} font-mono uppercase tracking-tighter`}>
                      {transaction.reference_id?.slice(0, 12) || '---'}
                    </td>
                    <td className={`px-4 py-4 text-[9px] font-medium ${textSecondary} max-w-xs truncate italic`}>
                      {transaction.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-center bg-gray-50/50 dark:bg-gray-800/30">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
