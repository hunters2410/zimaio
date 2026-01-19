import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, TrendingDown, Search, Plus, Check, X, AlertCircle, Filter, Clock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  balance_usd: number;
  balance_zig: number;
  pending_balance: number;
  total_earned: number;
  total_commission_earned: number;
  total_withdrawn: number;
  currency_code: string;
  is_active: boolean;
  user_email: string;
  user_name: string;
  user_role: string;
}

interface WithdrawalRequest {
  id: string;
  vendor_id: string;
  amount: number;
  currency: string;
  status: string;
  withdrawal_charges: number;
  net_amount: number;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
  payment_method: string | null;
  vendor_name: string;
  vendor_email: string;
}

export function WalletManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'USD' | 'ZIG'>('ALL');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositCurrency, setDepositCurrency] = useState<'USD' | 'ZIG'>('USD');
  const [depositDescription, setDepositDescription] = useState('');
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalBalanceUSD: 0,
    totalBalanceZIG: 0,
    totalEarned: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0
  });

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchWallets();
    fetchWithdrawalRequests();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wallets')
        .select(`
          *,
          profiles!wallets_user_id_fkey(email, full_name, role)
        `)
        .order('balance_usd', { ascending: false });

      const formatted = (data || []).map((w: any) => ({
        ...w,
        balance: Number(w.balance) || 0,
        balance_usd: Number(w.balance_usd) || 0,
        balance_zig: Number(w.balance_zig) || 0,
        pending_balance: Number(w.pending_balance) || 0,
        total_earned: Number(w.total_earned) || 0,
        total_commission_earned: Number(w.total_commission_earned) || 0,
        total_withdrawn: Number(w.total_withdrawn) || 0,
        user_email: w.profiles?.email || 'N/A',
        user_name: w.profiles?.full_name || 'N/A',
        user_role: w.profiles?.role || 'N/A'
      }));

      setWallets(formatted);

      const totalBalanceUSD = formatted.reduce((sum, w) => sum + w.balance_usd, 0);
      const totalBalanceZIG = formatted.reduce((sum, w) => sum + w.balance_zig, 0);
      const totalEarned = formatted.reduce((sum, w) => sum + w.total_earned, 0);
      const totalWithdrawn = formatted.reduce((sum, w) => sum + w.total_withdrawn, 0);

      setStats({
        totalBalanceUSD,
        totalBalanceZIG,
        totalEarned,
        totalWithdrawn,
        pendingWithdrawals: 0
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles!withdrawal_requests_vendor_id_fkey(email, full_name)
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((req: any) => ({
        ...req,
        vendor_name: req.profiles?.full_name || 'N/A',
        vendor_email: req.profiles?.email || 'N/A'
      }));

      setWithdrawalRequests(formatted);

      const pendingCount = formatted.filter((req: any) => req.status === 'pending').length;
      setStats(prev => ({ ...prev, pendingWithdrawals: pendingCount }));
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setLoading(true);
    try {
      const amount = parseFloat(depositAmount);
      const balanceField = depositCurrency === 'USD' ? 'balance_usd' : 'balance_zig';
      const currentBalance = depositCurrency === 'USD' ? selectedWallet.balance_usd : selectedWallet.balance_zig;
      const newBalance = currentBalance + amount;

      const { error: walletError } = await supabase
        .from('wallets')
        .update({ [balanceField]: newBalance })
        .eq('id', selectedWallet.id);

      if (walletError) throw walletError;

      const { error: transactionError } = await supabase
        .from('wallet_transactions_detailed')
        .insert([{
          wallet_id: selectedWallet.id,
          transaction_type: 'deposit',
          amount: amount,
          currency: depositCurrency,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: depositDescription || `Admin deposit of ${amount} ${depositCurrency}`,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: { source: 'admin_manual_deposit' }
        }]);

      if (transactionError) throw transactionError;

      setMessage({ type: 'success', text: 'Deposit successful' });
      setShowDepositModal(false);
      setDepositAmount('');
      setDepositDescription('');
      fetchWallets();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingWithdrawal(requestId);
    try {
      const request = withdrawalRequests.find(r => r.id === requestId);
      if (!request) return;

      if (action === 'approve') {
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', request.vendor_id)
          .single();

        if (!walletData) throw new Error('Wallet not found');

        const balanceField = request.currency === 'USD' ? 'balance_usd' : 'balance_zig';
        const currentBalance = request.currency === 'USD' ? walletData.balance_usd : walletData.balance_zig;

        if (currentBalance < request.amount) {
          throw new Error('Insufficient balance');
        }

        const newBalance = currentBalance - request.amount;
        const newTotalWithdrawn = (walletData.total_withdrawn || 0) + request.amount;

        const { error: walletError } = await supabase
          .from('wallets')
          .update({
            [balanceField]: newBalance,
            total_withdrawn: newTotalWithdrawn
          })
          .eq('user_id', request.vendor_id);

        if (walletError) throw walletError;

        const { error: transactionError } = await supabase
          .from('wallet_transactions_detailed')
          .insert([
            {
              wallet_id: walletData.id,
              transaction_type: 'withdrawal',
              amount: -request.amount,
              currency: request.currency,
              balance_before: currentBalance,
              balance_after: newBalance,
              reference_id: requestId,
              reference_type: 'withdrawal_request',
              description: `Withdrawal approved: ${request.amount} ${request.currency}`,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            },
            {
              wallet_id: walletData.id,
              transaction_type: 'charge',
              amount: -request.withdrawal_charges,
              currency: request.currency,
              balance_before: newBalance,
              balance_after: newBalance,
              reference_id: requestId,
              reference_type: 'withdrawal_charge',
              description: `Withdrawal charge: ${request.withdrawal_charges} ${request.currency}`,
              created_by: (await supabase.auth.getUser()).data.user?.id,
            }
          ]);

        if (transactionError) throw transactionError;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: action === 'approve' ? 'completed' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });

      fetchWithdrawalRequests();
      fetchWallets();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const filteredWallets = wallets.filter(wallet =>
    (wallet.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.user_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pendingRequests = withdrawalRequests.filter(req => req.status === 'pending');

  if (loading && wallets.length === 0) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Wallet Management</h1>
            <p className={textSecondary}>Monitor wallets, manage deposits, and process withdrawals</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setCurrencyFilter('ALL')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  currencyFilter === 'ALL'
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCurrencyFilter('USD')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  currencyFilter === 'USD'
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrencyFilter('ZIG')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                  currencyFilter === 'ZIG'
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ZIG
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">${stats.totalBalanceUSD.toFixed(2)}</div>
          <p className="text-cyan-100">Total USD Balance</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalBalanceZIG.toFixed(2)} ZIG</div>
          <p className="text-green-100">Total ZIG Balance</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">${stats.totalEarned.toFixed(2)}</div>
          <p className="text-blue-100">Total Earned</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.pendingWithdrawals}</div>
          <p className="text-orange-100">Pending Withdrawals</p>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className={`${cardBg} rounded-lg shadow-sm p-6 mb-6 border ${borderColor}`}>
          <h2 className={`text-xl font-bold ${textPrimary} mb-4`}>Pending Withdrawal Requests</h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className={`p-4 border ${borderColor} rounded-lg flex items-center justify-between`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-semibold ${textPrimary}`}>{request.vendor_name}</span>
                    <span className={`text-sm ${textSecondary}`}>{request.vendor_email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={textSecondary}>
                      Amount: <span className="font-semibold text-cyan-600">{request.amount} {request.currency}</span>
                    </span>
                    <span className={textSecondary}>
                      Charges: <span className="font-semibold text-red-600">{request.withdrawal_charges} {request.currency}</span>
                    </span>
                    <span className={textSecondary}>
                      Net: <span className="font-semibold text-green-600">{request.net_amount} {request.currency}</span>
                    </span>
                    <span className={`text-xs ${textSecondary}`}>
                      Requested: {new Date(request.requested_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleProcessWithdrawal(request.id, 'approve')}
                    disabled={processingWithdrawal === request.id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Enter rejection reason:');
                      if (reason) handleProcessWithdrawal(request.id, 'reject', reason);
                    }}
                    disabled={processingWithdrawal === request.id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`${cardBg} rounded-lg shadow-sm p-6 mb-6 border ${borderColor}`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary} h-5 w-5`} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
            }`}
          />
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm overflow-hidden border ${borderColor}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                User
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                Role
              </th>
              {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                <th className={`px-6 py-3 text-right text-xs font-medium ${textSecondary} uppercase`}>
                  USD Balance
                </th>
              )}
              {(currencyFilter === 'ALL' || currencyFilter === 'ZIG') && (
                <th className={`px-6 py-3 text-right text-xs font-medium ${textSecondary} uppercase`}>
                  ZIG Balance
                </th>
              )}
              <th className={`px-6 py-3 text-right text-xs font-medium ${textSecondary} uppercase`}>
                Commission Earned
              </th>
              <th className={`px-6 py-3 text-right text-xs font-medium ${textSecondary} uppercase`}>
                Total Withdrawn
              </th>
              <th className={`px-6 py-3 text-center text-xs font-medium ${textSecondary} uppercase`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${cardBg} divide-y divide-gray-200 dark:divide-gray-700`}>
            {filteredWallets.map((wallet) => (
              <tr key={wallet.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className={`text-sm font-medium ${textPrimary}`}>{wallet.user_name}</div>
                    <div className={`text-sm ${textSecondary}`}>{wallet.user_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-100">
                    {wallet.user_role}
                  </span>
                </td>
                {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${textPrimary}`}>
                      ${wallet.balance_usd.toFixed(2)}
                    </div>
                  </td>
                )}
                {(currencyFilter === 'ALL' || currencyFilter === 'ZIG') && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${textPrimary}`}>
                      {wallet.balance_zig.toFixed(2)} ZIG
                    </div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-cyan-600 dark:text-cyan-400">
                    ${wallet.total_commission_earned.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm text-red-600 dark:text-red-400">
                    ${wallet.total_withdrawn.toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => {
                      setSelectedWallet(wallet);
                      setShowDepositModal(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Deposit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredWallets.length === 0 && (
          <div className={`text-center py-12 ${textSecondary}`}>
            No wallets found.
          </div>
        )}
      </div>

      {showDepositModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${textPrimary}`}>Deposit to Wallet</h2>
              <button
                onClick={() => setShowDepositModal(false)}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className={`text-sm ${textSecondary} mb-1`}>User</p>
              <p className={`font-semibold ${textPrimary}`}>{selectedWallet.user_name}</p>
              <p className={`text-sm ${textSecondary}`}>{selectedWallet.user_email}</p>
            </div>

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Currency *</label>
                <select
                  required
                  value={depositCurrency}
                  onChange={(e) => setDepositCurrency(e.target.value as 'USD' | 'ZIG')}
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                >
                  <option value="USD">USD</option>
                  <option value="ZIG">ZIG</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-2`}>Description</label>
                <textarea
                  value={depositDescription}
                  onChange={(e) => setDepositDescription(e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className={`px-6 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                  {loading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
