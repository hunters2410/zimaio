import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Plus,
  Minus,
  Check,
  X,
  AlertCircle,
  Filter,
  Clock,
  Users,
  Truck,
  Store,
  Wallet as WalletIcon,
  ArrowUpRight,
  RefreshCcw,
  ShieldCheck
} from 'lucide-react';
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
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'vendor' | 'customer' | 'logistic' | 'admin'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<'ALL' | 'USD' | 'ZIG'>('ALL');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [adjustCurrency, setAdjustCurrency] = useState<'USD' | 'ZIG'>('USD');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalBalanceUSD: 0,
    totalBalanceZIG: 0,
    platformRevenueUSD: 0,
    platformRevenueZIG: 0,
    pendingWithdrawals: 0,
    pendingRevenueUSD: 0
  });

  useEffect(() => {
    ensureAdminWallet();
    fetchData();
  }, []);

  const ensureAdminWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!wallet) {
      console.log('Creating missing admin wallet...');
      await supabase.from('wallets').insert({
        user_id: user.id,
        balance: 0,
        balance_usd: 0,
        balance_zig: 0
      });
      fetchData(); // Reload after creation
    }
  };

  const initializeWallet = async (userId: string) => {
    setLoading(true);
    console.log('Initializing wallet for:', userId);
    try {
      const { data, error } = await supabase.from('wallets').upsert({
        user_id: userId,
        balance: 0,
        balance_usd: 0,
        balance_zig: 0
      }, { onConflict: 'user_id' }).select();

      if (error) {
        console.error('Initialization error:', error);
        throw error;
      }

      console.log('Wallet initialized successfully:', data);
      setMessage({ type: 'success', text: 'Wallet record prepared/synced.' });
      fetchData();
    } catch (err: any) {
      console.error('Initialization throw:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };


  const handleSyncLedgers = async () => {
    setLoading(true);
    setMessage({ type: 'success', text: 'Initiating global ledger sync...' });
    try {
      // 1. Fetch all successful orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      const paidOrders = (orders || []).filter(o => o.payment_status === 'paid' || o.status === 'delivered');

      if (paidOrders.length === 0) {
        setMessage({ type: 'error', text: 'No paid orders found to sync.' });
        setLoading(false);
        return;
      }

      // 2. Identify Admin and Vendor User Mapping
      const { data: adminProfile } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
      const { data: vProfiles } = await supabase.from('vendor_profiles').select('id, user_id');

      const vendorMap: Record<string, string> = {};
      vProfiles?.forEach(vp => vendorMap[vp.id] = vp.user_id);

      // 3. Group by identities
      const totals: Record<string, { earned: number, comm: number }> = {};

      paidOrders.forEach(order => {
        // Admin earned commission + vat
        if (adminProfile) {
          const adminId = adminProfile.id;
          if (!totals[adminId]) totals[adminId] = { earned: 0, comm: 0 };
          totals[adminId].earned += (Number(order.commission_amount) || 0) + (Number(order.vat_amount) || 0);
          totals[adminId].comm += (Number(order.commission_amount) || 0);
        }

        // Vendor earned subtotal
        const vendorUserId = vendorMap[order.vendor_id];
        if (vendorUserId) {
          if (!totals[vendorUserId]) totals[vendorUserId] = { earned: 0, comm: 0 };
          totals[vendorUserId].earned += (Number(order.subtotal) || 0);
        }
      });

      // 4. Update Wallets (Sequential)
      for (const [userId, stats] of Object.entries(totals)) {
        if (!userId) continue;

        await supabase.from('wallets').upsert({
          user_id: userId,
          balance_usd: stats.earned,
          total_commission_earned: stats.comm
        }, { onConflict: 'user_id' });
      }

      setMessage({ type: 'success', text: `Successfully synced ${paidOrders.length} orders into ledgers.` });
      fetchWallets();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Sync failed: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchWallets(), fetchWithdrawalRequests()]);
    setLoading(false);
  };


  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          email, 
          full_name, 
          role,
          id,
          wallets (*)
        `)
        .order('full_name', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((p: any) => {
        const w = p.wallets?.[0] || {};
        return {
          ...w,
          id: w.id || `virtual-${p.id}`,
          user_id: p.id,
          balance: Number(w.balance) || 0,
          balance_usd: Number(w.balance_usd) || Number(w.balance) || 0,
          balance_zig: Number(w.balance_zig) || 0,
          pending_balance: Number(w.pending_balance) || 0,
          total_earned: Number(w.total_earned) || 0,
          total_commission_earned: Number(w.total_commission_earned) || 0,
          total_withdrawn: Number(w.total_withdrawn) || 0,
          user_email: p.email || 'N/A',
          user_name: p.full_name || 'N/A',
          user_role: p.role || 'N/A'
        };
      });

      setWallets(formatted);

      // Identify Platform Revenue (Actual Earnings) directly from Orders to match Admin Dashboard
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('commission_amount, payment_status');

      if (ordersError) throw ordersError;

      // Calculate totals based on orders
      const totalComm = (ordersData || []).reduce((sum, o) => {
        // If order is paid, count as revenue
        return (o.payment_status === 'paid' || o.payment_status === 'completed')
          ? sum + Number(o.commission_amount || 0)
          : sum;
      }, 0);

      const totalPendingComm = (ordersData || []).reduce((sum, o) => {
        // If order is NOT paid, count as pending
        return (o.payment_status !== 'paid' && o.payment_status !== 'completed')
          ? sum + Number(o.commission_amount || 0)
          : sum;
      }, 0);

      const totalBalanceUSD = formatted.reduce((sum, w) => sum + w.balance_usd, 0);
      const totalBalanceZIG = formatted.reduce((sum, w) => sum + w.balance_zig, 0);

      setStats(prev => ({
        ...prev,
        totalBalanceUSD,
        totalBalanceZIG,
        platformRevenueUSD: totalComm,
        pendingRevenueUSD: totalPendingComm,
        platformRevenueZIG: 0
      }));

    } catch (error: any) {
      console.error('Error fetching wallets:', error);
      setMessage({ type: 'error', text: error.message });
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

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWallet) return;

    setLoading(true);
    try {
      const amount = parseFloat(adjustAmount);
      const actualAdjustment = adjustType === 'deposit' ? amount : -amount;

      const balanceField = adjustCurrency === 'USD' ? 'balance_usd' : 'balance_zig';
      const currentBalance = adjustCurrency === 'USD' ? selectedWallet.balance_usd : selectedWallet.balance_zig;
      const newBalance = currentBalance + actualAdjustment;

      if (newBalance < 0 && adjustType === 'withdrawal') {
        throw new Error('Insufficient funds for this adjustment');
      }

      const { data: upsertedWallet, error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: selectedWallet.user_id,
          [balanceField]: newBalance
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (walletError) throw walletError;

      // Log transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions_detailed')
        .insert([{
          wallet_id: upsertedWallet.id,
          transaction_type: adjustType,
          amount: actualAdjustment,
          currency: adjustCurrency,
          balance_before: currentBalance,
          balance_after: newBalance,
          description: adjustDescription || `Admin ${adjustType} of ${amount} ${adjustCurrency}`,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          metadata: { source: 'admin_manual_adjustment', adjusted_by_role: 'admin' }
        }]);

      if (transactionError) throw transactionError;

      setMessage({ type: 'success', text: `Successfully ${adjustType === 'deposit' ? 'added' : 'subtracted'} ${amount} ${adjustCurrency}` });
      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustDescription('');
      await fetchWallets();
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
          throw new Error('Insufficient balance in vendor wallet');
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

        // Log Withdrawal Transaction
        await supabase.from('wallet_transactions_detailed').insert({
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
        });
      }

      await supabase
        .from('withdrawal_requests')
        .update({
          status: action === 'approve' ? 'completed' : 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: (await supabase.auth.getUser()).data.user?.id,
          rejection_reason: reason
        })
        .eq('id', requestId);

      setMessage({
        type: 'success',
        text: `Withdrawal request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });

      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const filteredWallets = wallets.filter(wallet => {
    const matchesSearch =
      wallet.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.user_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'ALL' || wallet.user_role === activeTab;

    return matchesSearch && matchesTab;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'vendor': return <Store className="w-4 h-4" />;
      case 'logistic': return <Truck className="w-4 h-4" />;
      case 'admin': return <ShieldCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Finance Hub</h1>
          <p className="text-slate-600 font-bold uppercase tracking-widest text-xs mt-1">Global Wallet Audit & Treasury Management</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSyncLedgers}
            title="Settle all unpaid commissions & sales"
            className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border-2 border-indigo-100 rounded-2xl text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Ledgers
          </button>

          <button
            onClick={fetchData}
            className="p-3 bg-white border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="bg-gray-100 p-1 rounded-2xl flex items-center shadow-inner">
            {(['ALL', 'vendor', 'customer', 'logistic', 'admin'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? 'bg-white text-cyan-600 shadow-md scale-105'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* PLATFORM REVENUE - Highlighted */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-[2rem] p-8 border-2 border-slate-50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <ShieldCheck size={120} className="text-cyan-600" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <WalletIcon className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-700">Platform Treasury (Admin Commission)</span>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">USD Revenue</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-slate-900">${stats.platformRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                {stats.pendingRevenueUSD > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    + ${stats.pendingRevenueUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} Pending
                  </p>
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">ZIG Revenue</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter text-slate-900">{stats.platformRevenueZIG.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs font-black text-cyan-600">ZIG</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-50 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">Action Required</span>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Withdrawals</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.pendingWithdrawals}</p>
            {stats.pendingWithdrawals > 0 && (
              <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-full animate-pulse shadow-sm shadow-orange-500/50">Urgent</span>
            )}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {
        message && (
          <div className={`mb-8 p-6 rounded-3xl border-2 flex items-center justify-between animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
            }`}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>
        )
      }

      {/* Pending Withdrawals Section */}
      {
        withdrawalRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="mb-10 animate-in fade-in duration-500">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Queue: Withdrawal Requests
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {withdrawalRequests.filter(r => r.status === 'pending').map((request) => (
                <div key={request.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-orange-200 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center font-black text-slate-400 text-xs border border-slate-100 dark:border-slate-700">
                      {request.vendor_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{request.vendor_name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{request.vendor_email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">{request.amount} {request.currency}</span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{new Date(request.requested_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleProcessWithdrawal(request.id, 'approve')}
                      disabled={!!processingWithdrawal}
                      className="p-3 bg-green-600 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-green-600/20 active:scale-90 disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const r = prompt("Reason for rejection?");
                        if (r) handleProcessWithdrawal(request.id, 'reject', r);
                      }}
                      disabled={!!processingWithdrawal}
                      className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-white rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* Main Wallets Table */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 shadow-xl overflow-hidden mb-20 transition-all">
        <div className="p-8 border-b-2 border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            <input
              type="text"
              placeholder="Filter treasury by user, email, or profile..."
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-slate-100 rounded-2xl focus:border-cyan-500 transition-all outline-none font-bold text-sm text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-slate-300" />
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value as any)}
              className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest text-slate-500 focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD Treasury</option>
              <option value="ZIG">ZIG Treasury</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Master Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Classification</th>
                {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                  <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">USD Assets</th>
                )}
                {(currencyFilter === 'ALL' || currencyFilter === 'ZIG') && (
                  <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">ZIG Assets</th>
                )}
                <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Cumulative Yield</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {filteredWallets.map((wallet) => (
                <tr key={wallet.id} className="hover:bg-gray-50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border shadow-sm ${wallet.user_role === 'admin' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-400 border-slate-100'
                        }`}>
                        {wallet.user_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{wallet.user_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{wallet.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="p-1.5 bg-slate-100 rounded-lg group-hover:scale-110 transition-transform">
                        {getRoleIcon(wallet.user_role)}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{wallet.user_role}</span>
                    </div>
                  </td>
                  {(currencyFilter === 'ALL' || currencyFilter === 'USD') && (
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-slate-900 tracking-tight">${wallet.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </td>
                  )}
                  {(currencyFilter === 'ALL' || currencyFilter === 'ZIG') && (
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-cyan-600 tracking-tight">{wallet.balance_zig.toLocaleString(undefined, { minimumFractionDigits: 2 })} ZIG</p>
                    </td>
                  )}
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Earned: ${wallet.total_commission_earned.toLocaleString()}</span>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Out: ${wallet.total_withdrawn.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => {
                        setSelectedWallet(wallet);
                        setShowAdjustModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Top-up / Adjust
                    </button>
                  </td>
                </tr>
              ))}
              {filteredWallets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Search className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">No matching ledgers in system</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {
        showAdjustModal && selectedWallet && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-white/20">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Top-up / Adjust</h2>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Manually modify treasury for {selectedWallet.user_name}</p>
                </div>
                <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustBalance} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAdjustType('deposit')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustType === 'deposit' ? 'bg-white text-green-600 shadow-md scale-105' : 'text-slate-400'}`}
                  >
                    <Plus size={14} /> Add Fund
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('withdrawal')}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adjustType === 'withdrawal' ? 'bg-white text-red-600 shadow-md scale-105' : 'text-slate-400'}`}
                  >
                    <Minus size={14} /> Subtract
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Currency</label>
                    <select
                      value={adjustCurrency}
                      onChange={(e) => setAdjustCurrency(e.target.value as any)}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-700 focus:border-cyan-500 transition-all outline-none"
                    >
                      <option value="USD">USD</option>
                      <option value="ZIG">ZIG</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-black text-sm text-slate-700 focus:border-cyan-500 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Audit Note / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide context for this adjustment..."
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-medium text-sm text-slate-700 focus:border-cyan-500 transition-all outline-none resize-none"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-6">
                  <button
                    disabled={loading || !adjustAmount}
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {loading ? 'Transmitting...' : 'Commit Adjustment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="w-full py-5 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Discard Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </AdminLayout >
  );
}
