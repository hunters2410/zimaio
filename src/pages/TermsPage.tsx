import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Calendar, Shield } from 'lucide-react';

export function TermsPage() {
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
        .eq('contract_type', 'terms_and_conditions')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error fetching terms:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Terms Void</h1>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">The Terms & Conditions document could not be located in the current database registry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-900/5 p-8 md:p-12 border-2 border-slate-50 dark:border-slate-700">
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
              <FileText className="h-10 w-10 text-cyan-600 dark:text-cyan-400" />
              <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{contract.title}</h1>
            </div>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-2">
              Version {contract.version} • Updated {new Date(contract.updated_at).toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-cyan dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl border-2 border-slate-100 dark:border-slate-800">
              {contract.content}
            </div>
          </div>

          <section className="mt-12 pt-10 border-t-2 border-slate-50 dark:border-slate-700 text-center">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
              Legal Inquiries: <span className="text-cyan-600 dark:text-cyan-400">legal@zimaio.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

