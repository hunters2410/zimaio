import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Eye, Calendar } from 'lucide-react';

export function PrivacyPage() {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContract();
  }, []);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_type', 'privacy_policy')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Privacy Void</h1>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">The Privacy Policy document could not be located in the current database registry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 py-12 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl mb-6 border-2 border-emerald-100 dark:border-emerald-800 shadow-xl shadow-emerald-500/10">
            <Shield className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">{contract.title}</h1>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.4em]">
            Operational Protocol v{contract.version} • Updated {new Date(contract.updated_at).toLocaleDateString()}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/30 rounded-[3rem] p-8 md:p-12 border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-900/5">
          <div className="prose prose-emerald dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {contract.content}
            </div>
          </div>

          <div className="mt-16 pt-10 border-t-2 border-slate-100 dark:border-slate-800 text-center">
            <div className="flex flex-wrap justify-center gap-6 mb-8 mt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">End-to-End Encryption</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                <Eye className="w-4 h-4 text-cyan-500" />
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Minimal Data Collection</span>
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
              Security Concerns? <span className="text-emerald-600 dark:text-emerald-400 ml-2">security@zimaio.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
