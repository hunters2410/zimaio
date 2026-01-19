import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, DollarSign, TrendingUp, TrendingDown, Send, AlertCircle, X, Check, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletData {
  id: string;
  balance_usd: number;
  balance_zig: number;
  total_earned: number;
  total_commission_earned: number;
  total_withdrawn: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  withdrawal_charges: number;
  net_amount: number;
  requested_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}

export function VendorWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    currency: 'USD' as 'USD' | 'ZIG',
    payment_method: '',
    account_details: ''
  });

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchWithdrawalRequests();
    }
  }, [user]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setWallet({
        id: data.id,
        balance_usd: Number(data.balance_usd) || 0,
        balance_zig: Number(data.balance_zig) || 0,
        total_earned: Number(data.total_earned) || 0,
        total_commission_earned: Number(data.total_commission_earned) || 0,
        total_withdrawn: Number(data.total_withdrawn) || 0
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
        .select('*')
        .eq('vendor_id', user?.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching withdrawal requests:', error);
    }
  };

  const calculateCharges = (amount: number) => {
    return (amount * 0.02).toFixed(2);
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    setLoading(true);
    try {
      const amount = parseFloat(withdrawalForm.amount);
      const availableBalance = withdrawalForm.currency === 'USD' ? wallet.balance_usd : wallet.balance_zig;

      if (amount > availableBalance) {
        throw new Error('Insufficient balance');
      }

      if (amount < 10) {
        throw new Error('Minimum withdrawal amount is 10');
      }

      const charges = parseFloat(calculateCharges(amount));
      const netAmount = amount - charges;

      const { error } = await supabase
        .from('withdrawal_requests')
        .insert([{
          vendor_id: user?.id,
          amount: amount,
          currency: withdrawalForm.currency,
          withdrawal_charges: charges,
          net_amount: netAmount,
          payment_method: withdrawalForm.payment_method,
          account_details: { details: withdrawalForm.account_details },
          status: 'pending'
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Withdrawal request submitted successfully. Awaiting admin approval.' });
      setShowWithdrawModal(false);
      setWithdrawalForm({
        amount: '',
        currency: 'USD',
        payment_method: '',
        account_details: ''
      });
      fetchWithdrawalRequests();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    const icons = {
      pending: <Clock className="h-4 w-4" />,
      approved: <Check className="h-4 w-4" />,
      completed: <Check className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && !wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Wallet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-cyan-600" />
            My Wallet
          </h1>
          <p className="text-gray-600">Manage your earnings and withdrawals</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">${wallet.balance_usd.toFixed(2)}</div>
          <p className="text-cyan-100">USD Balance</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{wallet.balance_zig.toFixed(2)} ZIG</div>
          <p className="text-green-100">ZIG Balance</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">${wallet.total_commission_earned.toFixed(2)}</div>
          <p className="text-blue-100">Commission Earned</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-8 w-8" />
          </div>
          <div className="text-3xl font-bold mb-1">${wallet.total_withdrawn.toFixed(2)}</div>
          <p className="text-purple-100">Total Withdrawn</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Request Withdrawal</h2>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
          >
            <Send className="h-5 w-5" />
            Withdraw Funds
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Withdrawal Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Minimum withdrawal amount: $10 or 10 ZIG</li>
            <li>• Withdrawal charges: 2% of the withdrawal amount</li>
            <li>• Processing time: 1-3 business days after admin approval</li>
            <li>• All withdrawals require admin approval</li>
          </ul>
        </div>

        <h3 className="font-semibold text-gray-900 mb-4">Recent Withdrawal Requests</h3>

        {withdrawalRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No withdrawal requests yet
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawalRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-gray-900">
                        {request.amount} {request.currency}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Withdrawal Charges:</span>{' '}
                        <span className="text-red-600">{request.withdrawal_charges} {request.currency}</span>
                      </div>
                      <div>
                        <span className="font-medium">Net Amount:</span>{' '}
                        <span className="text-green-600 font-semibold">{request.net_amount} {request.currency}</span>
                      </div>
                      <div>
                        <span className="font-medium">Requested:</span>{' '}
                        {new Date(request.requested_at).toLocaleString()}
                      </div>
                      {request.processed_at && (
                        <div>
                          <span className="font-medium">Processed:</span>{' '}
                          {new Date(request.processed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {request.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <span className="font-medium">Rejection Reason:</span> {request.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Request Withdrawal</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-500 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleWithdrawalRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Currency *</label>
                <select
                  required
                  value={withdrawalForm.currency}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, currency: e.target.value as 'USD' | 'ZIG' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="USD">USD (Available: ${wallet.balance_usd.toFixed(2)})</option>
                  <option value="ZIG">ZIG (Available: {wallet.balance_zig.toFixed(2)})</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Amount *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="10"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Minimum 10"
                />
                {withdrawalForm.amount && (
                  <div className="mt-2 text-sm space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>Withdrawal Amount:</span>
                      <span className="font-medium">{withdrawalForm.amount} {withdrawalForm.currency}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Charges (2%):</span>
                      <span className="font-medium">{calculateCharges(parseFloat(withdrawalForm.amount))} {withdrawalForm.currency}</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold border-t pt-1">
                      <span>You will receive:</span>
                      <span>{(parseFloat(withdrawalForm.amount) - parseFloat(calculateCharges(parseFloat(withdrawalForm.amount)))).toFixed(2)} {withdrawalForm.currency}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Payment Method *</label>
                <select
                  required
                  value={withdrawalForm.payment_method}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="">Select payment method</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Account Details *</label>
                <textarea
                  required
                  value={withdrawalForm.account_details}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, account_details: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter your account details (account number, mobile number, email, etc.)"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Your withdrawal request will be reviewed by an admin. You will be notified once it's processed.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                  {loading ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
