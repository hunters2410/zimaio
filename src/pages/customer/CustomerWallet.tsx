import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingDown, Clock, AlertCircle, X, ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface WalletData {
    id: string;
    balance_usd: number;
    balance_zig: number;
    total_earned: number;
    total_withdrawn: number;
}

interface Transaction {
    id: string;
    transaction_type: string;
    amount: number;
    currency: string;
    description: string;
    created_at: string;
    status: string;
}

export function CustomerWallet() {
    const { user } = useAuth();
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (user) {
            fetchWalletData();
        }
    }, [user]);

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            // Get or create wallet
            let { data: walletData, error: walletError } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', user?.id)
                .single();

            if (walletError && walletError.code === 'PGRST116') {
                const { data: newWallet, error: createError } = await supabase
                    .from('wallets')
                    .insert([{ user_id: user?.id, balance_usd: 0, balance_zig: 0 }])
                    .select()
                    .single();
                if (createError) throw createError;
                walletData = newWallet;
            } else if (walletError) {
                throw walletError;
            }

            setWallet({
                id: walletData.id,
                balance_usd: Number(walletData.balance_usd) || 0,
                balance_zig: Number(walletData.balance_zig) || 0,
                total_earned: Number(walletData.total_earned) || 0,
                total_withdrawn: Number(walletData.total_withdrawn) || 0
            });

            // Fetch transactions
            const { data: transData, error: transError } = await supabase
                .from('wallet_transactions_detailed')
                .select('*')
                .eq('wallet_id', walletData.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (transError) throw transError;
            setTransactions(transData || []);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !wallet) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">My Treasury</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Personal Funds & Balance Audit</p>
                </div>
                <button
                    onClick={fetchWalletData}
                    className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90 shadow-sm group"
                >
                    <RefreshCcw className={`w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {message && (
                <div className={`p-6 rounded-[2rem] flex items-center justify-between border-2 animate-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50 text-red-700 dark:text-red-400'}`}>
                    <div className="flex items-center gap-4">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"><X size={20} /></button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group border-4 border-white/5">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80">USD Balance</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter">${wallet?.balance_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            <ArrowUpRight className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border-2 border-slate-50 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                            <RefreshCcw className="w-5 h-5 text-cyan-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ZIG Treasury</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{wallet?.balance_zig.toLocaleString()} <span className="text-xs">ZIG</span></p>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 border-2 border-slate-50 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Total Spent</span>
                    </div>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">${wallet?.total_withdrawn?.toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-50 dark:border-slate-700 shadow-xl overflow-hidden">
                <div className="p-8 border-b-2 border-slate-50 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Recent Activity</h2>
                    <Clock className="w-4 h-4 text-slate-300" />
                </div>

                <div className="divide-y-2 divide-slate-50 dark:divide-slate-800">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-l-4 border-transparent hover:border-cyan-500">
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-[1.5rem] shadow-sm ${tx.amount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
                                    {tx.amount > 0 ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">{tx.description}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-lg font-black tracking-tighter ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                                </p>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">{tx.transaction_type}</span>
                            </div>
                        </div>
                    ))}
                    {transactions.length === 0 && (
                        <div className="p-32 text-center">
                            <RefreshCcw className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-6" />
                            <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.6em]">No financial data logged yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
