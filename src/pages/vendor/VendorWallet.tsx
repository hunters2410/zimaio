import React, { useState, useEffect } from 'react';
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
      pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
      approved: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
      completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50'
    };

    const icons = {
      pending: <Clock className="h-4 w-4" />,
      approved: <Check className="h-4 w-4" />,
      completed: <Check className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && !wallet) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent shadow-lg shadow-emerald-500/10"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Loading Wallet...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mt-8">
        <Wallet className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Wallet not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            My Wallet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your earnings, check balances and request withdrawals.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">

        {message && (
          <div
            className={`p-4 rounded-2xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 shadow-sm ${message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-800 dark:text-red-400'
              }`}
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-bold uppercase tracking-tight">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-2xl shadow-xl shadow-emerald-500/20 p-6 text-white border border-emerald-400/20">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-3xl font-black mb-1 tabular-nums">${wallet.balance_usd.toFixed(2)}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">USD Balance</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl shadow-xl shadow-slate-900/20 p-6 text-white border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-3xl font-black mb-1 tabular-nums">{wallet.balance_zig.toFixed(2)} ZIG</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">ZIG Balance</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 p-6 text-white border border-blue-400/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-3xl font-black mb-1 tabular-nums">${wallet.total_commission_earned.toFixed(2)}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/80">Commission Earned</p>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 dark:from-fuchsia-600 dark:to-fuchsia-700 rounded-2xl shadow-xl shadow-fuchsia-500/20 p-6 text-white border border-fuchsia-400/20">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-8 w-8 opacity-50" />
            </div>
            <div className="text-3xl font-black mb-1 tabular-nums">${wallet.total_withdrawn.toFixed(2)}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-fuchsia-100/80">Total Withdrawn</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Withdrawal Management</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Request funds and track your withdrawal history.</p>
            </div>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 shrink-0"
            >
              <Send className="h-4 w-4" />
              Withdraw Funds
            </button>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 mb-8">
            <h3 className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5" />
              Withdrawal Information
            </h3>
            <ul className="text-[11px] text-blue-700 dark:text-blue-300/80 space-y-2 font-medium">
              <li className="flex items-center gap-2">• Minimum withdrawal amount: <span className="font-bold text-blue-900 dark:text-blue-300">$10 or 10 ZIG</span></li>
              <li className="flex items-center gap-2">• Withdrawal charges: <span className="font-bold text-blue-900 dark:text-blue-300">2% of the amount</span></li>
              <li className="flex items-center gap-2">• Processing time: <span className="font-bold text-blue-900 dark:text-blue-300">1-3 business days</span></li>
              <li className="flex items-center gap-2">• All withdrawals require admin approval</li>
            </ul>
          </div>

          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Recent Withdrawal Requests</h3>

          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawalRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-slate-50/30 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                          {request.amount.toLocaleString()} {request.currency}
                        </span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8">
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Withdrawal Charges</p>
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">-{request.withdrawal_charges} {request.currency}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Amount</p>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{request.net_amount.toLocaleString()} {request.currency}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date Requested</p>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(request.requested_at).toLocaleString()}</p>
                        </div>
                        {request.processed_at && (
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Date Processed</p>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{new Date(request.processed_at).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      {request.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            <span className="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">Rejection Reason</span>
                          </div>
                          <p className="text-xs font-bold text-red-600 dark:text-red-400/80 leading-relaxed">{request.rejection_reason}</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col border border-slate-100 dark:border-slate-700">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Request Withdrawal</h2>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Withdraw your earnings to your preferred account</p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                >
                  <X className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleWithdrawalRequest} className="flex flex-col overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Currency *</label>
                    <select
                      required
                      value={withdrawalForm.currency}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, currency: e.target.value as 'USD' | 'ZIG' })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                    >
                      <option value="USD">USD (Available: ${wallet.balance_usd.toFixed(2)})</option>
                      <option value="ZIG">ZIG (Available: {wallet.balance_zig.toFixed(2)})</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Amount *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="10"
                      value={withdrawalForm.amount}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[14px] font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Minimum 10"
                    />
                    {withdrawalForm.amount && (
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400">
                          <span>Withdrawal Amount</span>
                          <span className="text-slate-900 dark:text-white font-black tabular-nums">{withdrawalForm.amount} {withdrawalForm.currency}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-red-500 dark:text-red-400/80">
                          <span>Charges (2%)</span>
                          <span className="tabular-nums">-{calculateCharges(parseFloat(withdrawalForm.amount))} {withdrawalForm.currency}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          <span>You will receive</span>
                          <span className="text-sm tabular-nums">{(parseFloat(withdrawalForm.amount) - parseFloat(calculateCharges(parseFloat(withdrawalForm.amount)))).toFixed(2)} {withdrawalForm.currency}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Payment Method *</label>
                    <select
                      required
                      value={withdrawalForm.payment_method}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, payment_method: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                    >
                      <option value="">Select payment method</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Account Details *</label>
                    <textarea
                      required
                      value={withdrawalForm.account_details}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, account_details: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-slate-300"
                      placeholder="Account number, Account Name, Mobile Number, etc..."
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tighter">
                      Note: Your request will be reviewed by an admin. You'll be notified via email once processed.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(false)}
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[9px] border border-slate-200 dark:border-slate-700 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[9px]"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        Submit Request
                      </>
                    )}
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
