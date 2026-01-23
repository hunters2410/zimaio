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
      <div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Not Found</h1>
            <p className="text-gray-600">The requested contract could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="min-h-screen bg-white py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-8 w-8 text-cyan-600" />
                <h1 className="text-4xl font-bold text-gray-900">{contract.title}</h1>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Version {contract.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Last Updated: {new Date(contract.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="prose prose-cyan max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {contract.content}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <p>
                Effective Date: {new Date(contract.effective_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
