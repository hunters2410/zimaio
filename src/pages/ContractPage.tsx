import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { supabase } from '../lib/supabase';
import { FileText, Calendar } from 'lucide-react';

export function ContractPage() {
  const { type } = useParams<{ type: string }>();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContract();
  }, [type]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('contract_type', type)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setContract(data);
    } catch (error) {
      console.error('Error fetching contract:', error);
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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Contract Void</h1>
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">The requested protocol document could not be located in the current database registry.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 py-12 transition-colors duration-300">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8 md:p-12 border border-blue-50 dark:border-slate-700">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{contract.title}</h1>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 uppercase font-bold tracking-widest text-[10px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Version {contract.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Last Updated: {new Date(contract.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-cyan dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {contract.content}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-gray-400 uppercase font-bold tracking-widest text-[10px]">
            <p>
              Effective Date: {new Date(contract.effective_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
