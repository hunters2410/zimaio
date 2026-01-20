import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, Save, AlertCircle, RefreshCw, TrendingUp, Info, DollarSign, ArrowUpRight, History, X, CreditCard, CheckCircle, Store } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
}

interface VendorCurrencyRate {
  id: string;
  vendor_id: string;
  currency_code: string;
  exchange_rate: number;
  is_active: boolean;
  updated_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  payment_method: string;
}

interface PaymentGateway {
  id: string;
  gateway_name: string;
  gateway_type: string;
  is_active: boolean;
}

export function VendorCurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [vendorRates, setVendorRates] = useState<VendorCurrencyRate[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editableRates, setEditableRates] = useState<Record<string, string>>({});

  // Modal states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedGateway, setSelectedGateway] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      setUserId(user.id);

      const [vendorProfileRes, walletRes, gatewaysRes, historyRes] = await Promise.all([
        supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('payment_gateways')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('vendor_id', user.id)
          .order('requested_at', { ascending: false })
      ]);

      if (vendorProfileRes.error) throw vendorProfileRes.error;
      const vendorProfile = vendorProfileRes.data;
      setVendorId(vendorProfile.id);

      if (walletRes.data) {
        setBalance(walletRes.data.balance || 0);
      } else {
        console.warn('Wallet data not found for user');
        setBalance(0);
      }

      if (gatewaysRes.data) setGateways(gatewaysRes.data);
      if (historyRes.data) setWithdrawalHistory(historyRes.data);

      const [currenciesRes, ratesRes] = await Promise.all([
        supabase
          .from('currencies')
          .select('*')
          .eq('is_active', true)
          .in('code', ['USD', 'ZWL'])
          .order('code'),
        supabase
          .from('vendor_currency_rates')
          .select('*')
          .eq('vendor_id', vendorProfile.id)
      ]);

      if (currenciesRes.error) throw currenciesRes.error;
      if (ratesRes.error) throw ratesRes.error;

      setCurrencies(currenciesRes.data || []);
      setVendorRates(ratesRes.data || []);

      const rates: Record<string, string> = {};
      (ratesRes.data || []).forEach(rate => {
        if (rate.currency_code && rate.exchange_rate !== undefined) {
          rates[rate.currency_code] = rate.exchange_rate.toString();
        }
      });
      setEditableRates(rates);

    } catch (error: any) {
      console.error('Error in VendorCurrencyManagement fetchData:', error);
      setMessage({ type: 'error', text: `Failed to load wallet data: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      alert('Insufficient balance');
      return;
    }

    if (!selectedGateway) {
      alert('Please select a payment gateway');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          vendor_id: userId,
          amount: amount,
          currency: 'USD',
          status: 'pending',
          payment_method: selectedGateway,
          net_amount: amount * 0.98, // Assuming 2% fee as per migration
          withdrawal_charges: amount * 0.02
        });

      if (error) throw error;

      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setMessage({ type: 'success', text: 'Withdrawal request submitted successfully.' });
      fetchData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRateChange = (currencyCode: string, value: string) => {
    if (currencyCode === 'USD') return;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setEditableRates(prev => ({ ...prev, [currencyCode]: value }));
    }
  };

  const handleSave = async () => {
    if (!vendorId) return;
    setSaving(true);
    setMessage(null);

    try {
      for (const [currencyCode, rateStr] of Object.entries(editableRates)) {
        if (currencyCode === 'USD') continue;
        const rate = parseFloat(rateStr);
        if (isNaN(rate) || rate <= 0) throw new Error(`Invalid rate for ${currencyCode}`);

        const existingRate = vendorRates.find(r => r.currency_code === currencyCode);
        if (existingRate) {
          await supabase.from('vendor_currency_rates').update({ exchange_rate: rate, updated_at: new Date().toISOString() }).eq('id', existingRate.id);
        } else {
          await supabase.from('vendor_currency_rates').insert({ vendor_id: vendorId, currency_code: currencyCode, exchange_rate: rate, is_active: true });
        }
      }
      setMessage({ type: 'success', text: 'Changes saved successfully.' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSystem = (currencyCode: string) => {
    const sys = currencies.find(c => c.code === currencyCode);
    if (sys) setEditableRates(prev => ({ ...prev, [currencyCode]: sys.exchange_rate.toString() }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Wallet className="text-white w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-0.5">Available Balance</p>
              <h2 className="text-3xl font-black text-gray-900 leading-none">
                <span className="text-gray-400 text-xl mr-1">$</span>
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              WITHDRAW
            </button>
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-all border border-gray-200 active:scale-95 shadow-sm"
            >
              <History className="w-4 h-4" />
              HISTORY
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Exchange Rates Section */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Exchange Rate Control</h3>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-gray-100">Market Basis: 1 USD</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {currencies.map(currency => {
              const currentRate = editableRates[currency.code] || currency.exchange_rate.toString();
              const isUSD = currency.code === 'USD';

              return (
                <div key={currency.code} className={`p-5 rounded-2xl border ${isUSD ? 'bg-gray-50/50 border-gray-100 opacity-80' : 'bg-white border-gray-200'} transition-all hover:shadow-md hover:shadow-gray-100/50`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${isUSD ? 'bg-gray-100 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        {currency.symbol}
                      </div>
                      <div>
                        <span className="font-black text-gray-900 text-xs uppercase tracking-tight block">{currency.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{currency.code}</span>
                      </div>
                    </div>
                    {isUSD && <span className="text-[9px] font-black text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full letter-spacing-widest">DEFAULT</span>}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Your Custom Rate</label>
                      <div className="relative group">
                        <input
                          type="text"
                          value={currentRate}
                          disabled={isUSD}
                          onChange={(e) => handleRateChange(currency.code, e.target.value)}
                          className="w-full pl-9 pr-12 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        />
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        {!isUSD && (
                          <button
                            onClick={() => handleResetToSystem(currency.code)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-emerald-600 transition-colors bg-gray-50 rounded-lg"
                            title="Reset to system rate"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!isUSD && (
                      <div className="pt-3 border-t border-gray-50 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-gray-400 flex items-center gap-1"><Store className="w-3 h-3" /> System Rate</span>
                          <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{currency.exchange_rate}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-gray-400 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Live Rate</span>
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {vendorRates.find(r => r.currency_code === currency.code)?.exchange_rate || currency.exchange_rate}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 border border-blue-50 bg-blue-50/20 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 opacity-5">
              <Info className="w-20 h-20 text-blue-500" />
            </div>
            <div className="flex items-start gap-3 relative z-10">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
              </div>
              <p className="text-xs text-blue-800 font-medium leading-relaxed max-w-md">
                Set your custom exchange rates to control your profit margins.
                Prices on the storefront will be automatically calculated using these specific rates only for your store.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95 uppercase tracking-wider relative z-10"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Processing...' : 'Save Rates'}
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <ArrowUpRight className="text-white w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Withdraw Funds</h3>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-6 space-y-5">
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Max Available</p>
                  <p className="text-2xl font-black text-emerald-700">${balance.toFixed(2)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-emerald-200" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount to Withdraw (USD)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-lg font-black focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                  />
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Automatic Gateway</label>
                <div className="grid grid-cols-1 gap-3">
                  {gateways.map(gw => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setSelectedGateway(gw.gateway_name)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedGateway === gw.gateway_name ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedGateway === gw.gateway_name ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-gray-900">{gw.gateway_name}</span>
                      </div>
                      {selectedGateway === gw.gateway_name && <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />}
                    </button>
                  ))}
                  {gateways.length === 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                      <p className="text-xs text-gray-400">No payment gateways configured.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || !withdrawAmount || !selectedGateway}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-4 rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-emerald-600/20 active:scale-95 uppercase tracking-widest"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Processing...' : 'Request Withdrawal'}
                </button>
                <p className="text-[10px] text-gray-400 text-center mt-4">Transactions include a 2.0% platform processing fee.</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/20 text-white">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Withdrawal History</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-0 overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/80 sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gateway</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {withdrawalHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <History className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No transaction history found</p>
                        </td>
                      </tr>
                    ) : (
                      withdrawalHistory.map(req => (
                        <tr key={req.id} className="hover:bg-gray-50/50 group transition-all">
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-900 leading-none block">{new Date(req.requested_at).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-gray-600 uppercase tracking-tighter">{req.payment_method}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-black text-gray-900">${req.amount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-green-50 text-green-700' :
                              req.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Showing {withdrawalHistory.length} Transactions</span>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-tight">Close Records</button>
            </div>
          </div>
        </div>
      )}

      {currencies.length === 0 && !loading && !message && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <DollarSign className="w-12 h-12 text-gray-100 mx-auto mb-4" />
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No active currencies configured.</p>
        </div>
      )}
    </div>
  );
}

