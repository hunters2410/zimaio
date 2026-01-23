import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, DollarSign, TrendingUp, Send, Check, Clock, XCircle, AlertCircle, X, RefreshCcw, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletData {
    id: string;
    balance_usd: number;
    balance_zig: number;
    total_earned: number;
    total_withdrawn: number;
}

interface WithdrawalRequest {
    id: string;
    amount: number;
    currency: string;
    status: string;
    requested_at: string;
    processed_at: string | null;
    net_amount: number;
}

export function LogisticWallet() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [form, setForm] = useState({
        amount: '',
        currency: 'USD' as 'USD' | 'ZIG',
        method: '',
        details: ''
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Wallet
            const { data: wData, error: wError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (wData) {
                setWallet({
                    id: wData.id,
                    balance_usd: Number(wData.balance_usd) || 0,
                    balance_zig: Number(wData.balance_zig) || 0,
                    total_earned: Number(wData.total_earned) || 0,
                    total_withdrawn: Number(wData.total_withdrawn) || 0
                });
            }

            // Withdrawals
            const { data: qData, error: qError } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('vendor_id', user?.id) // Logistics use the same table, vendor_id is just the user uuid linked
                .order('requested_at', { ascending: false });

            if (qError) throw qError;
            setWithdrawals(qData || []);

        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wallet) return;
        setLoading(true);

        try {
            const amt = parseFloat(form.amount);
            const balance = form.currency === 'USD' ? wallet.balance_usd : wallet.balance_zig;

            if (amt > balance) throw new Error("Insufficient funds");
            if (amt < 10) throw new Error("Minimum withdrawal is 10");

            const charges = amt * 0.02;
            const net = amt - charges;

            const { error } = await supabase
                .from('withdrawal_requests')
                .insert([{
                    vendor_id: user?.id,
                    amount: amt,
                    currency: form.currency,
                    withdrawal_charges: charges,
                    net_amount: net,
                    payment_method: form.method,
                    account_details: { details: form.details },
                    status: 'pending'
                }]);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Request submitted for audit' });
            setShowWithdrawModal(false);
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Logistics Wallet</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Earnings & Settlement Manager</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchData}
                        className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 rounded-2xl shadow-sm"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                        Withdraw Funds
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group border-4 border-white/10">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="p-2 bg-white/10 rounded-xl">
                                <DollarSign className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">Available USD</span>
                        </div>
                        <span className="text-5xl font-black tracking-tighter">${wallet?.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border-2 border-slate-50 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Lifetime Earnings</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">${wallet?.total_earned.toLocaleString()}</span>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 border-2 border-slate-50 dark:border-slate-700 shadow-sm relative">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Pending Clearance</span>
                    </div>
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">0.00 <span className="text-xs">USD</span></span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[3rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-10 border-b-2 border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Withdrawal Queue & History</h2>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Updates
                    </div>
                </div>

                <div className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                    {withdrawals.map((req) => (
                        <div key={req.id} className="p-8 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-2xl shadow-sm ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {req.status === 'completed' ? <Check size={20} /> : <Clock size={20} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">${req.amount} {req.currency}</span>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{req.status}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requested on {new Date(req.requested_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Settlement Net</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">${req.net_amount.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                    {withdrawals.length === 0 && (
                        <div className="p-20 text-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">No settlement history found</p>
                        </div>
                    )}
                </div>
            </div>

            {showWithdrawModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-white/20">
                        <div className="p-10 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Withdraw Earnings</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Funds will be audited before transmission</p>
                            </div>
                            <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X /></button>
                        </div>

                        <form onSubmit={handleWithdraw} className="p-10 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</label>
                                    <select
                                        required
                                        value={form.currency}
                                        onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-black text-xs uppercase focus:border-indigo-500 outline-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="ZIG">ZIG</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0.00"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-black text-sm focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settlement Path</label>
                                <select
                                    required
                                    value={form.method}
                                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-black text-xs uppercase focus:border-indigo-500 outline-none"
                                >
                                    <option value="">Select Method</option>
                                    <option value="ecocash">EcoCash / Mobile Money</option>
                                    <option value="bank">Direct Bank Transfer</option>
                                    <option value="innbucks">Innbucks</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination Details</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Account number, phone number, or IBAN..."
                                    value={form.details}
                                    onChange={(e) => setForm({ ...form, details: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-2xl font-medium text-sm focus:border-indigo-500 outline-none resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !form.amount}
                                className="w-full py-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                            >
                                {loading ? 'Submitting...' : 'Commit Withdrawal'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
