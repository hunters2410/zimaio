import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FileCheck, Edit, Eye, Save, X, AlertCircle, Clock, Check, List, Grid } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Contract {
  id: string;
  contract_type: string;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export function VendorContracts() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: '1.0',
    contract_type: 'terms_and_conditions'
  });

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .in('contract_type', ['terms_and_conditions', 'privacy_policy'])
        .order('contract_type', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      title: contract.title,
      content: contract.content,
      version: contract.version,
      contract_type: contract.contract_type
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .insert([{
          title: formData.title,
          content: formData.content,
          version: formData.version,
          contract_type: formData.contract_type,
          is_active: true
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Policy created successfully' });
      setIsAdding(false);
      fetchContracts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          title: formData.title,
          content: formData.content,
          version: formData.version,
        })
        .eq('id', editingContract.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Contract updated successfully' });
      setEditingContract(null);
      fetchContracts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (contract: Contract) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ is_active: !contract.is_active })
        .eq('id', contract.id);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Contract ${contract.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      fetchContracts();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'terms_and_conditions':
        return 'Terms & Conditions';
      case 'privacy_policy':
        return 'Privacy Policy';
      default:
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  if (loading && contracts.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
              <FileCheck className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Policies Management</h1>
              <p className={`text-xs ${textSecondary}`}>Manage site-wide terms and conditions and privacy policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFormData({ title: '', content: '', version: '1.0', contract_type: 'terms_and_conditions' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition shadow-lg shadow-cyan-500/20 font-bold text-xs"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Add Policy
            </button>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-cyan-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-cyan-600 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                <Grid className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success'
            ? 'bg-green-50 border-2 border-green-100 text-green-800'
            : 'bg-red-50 border-2 border-red-100 text-red-800'
            }`}
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="font-bold text-sm uppercase tracking-tight">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-white/50 rounded-full transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {viewMode === 'list' ? (
        <div className={`${cardBg} rounded-xl shadow-lg border ${borderColor} overflow-hidden overflow-x-auto mb-8`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className={`px-4 py-3 text-left text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Contract Type
                </th>
                <th className={`px-4 py-3 text-left text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Title
                </th>
                <th className={`px-4 py-3 text-left text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Version
                </th>
                <th className={`px-4 py-3 text-left text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Status
                </th>
                <th className={`px-4 py-3 text-left text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Last Updated
                </th>
                <th className={`px-4 py-3 text-center text-[10px] font-black ${textSecondary} uppercase tracking-widest`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`${cardBg} divide-y divide-gray-200 dark:divide-gray-700`}>
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-4 bg-cyan-500 rounded-full"></div>
                      <span className={`text-xs font-bold ${textPrimary} uppercase tracking-tight`}>
                        {getContractTypeLabel(contract.contract_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs font-medium ${textPrimary}`}>{contract.title}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold ${textSecondary} bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded`}>
                      v{contract.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${contract.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {contract.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`text-[9px] font-bold ${textSecondary} uppercase tracking-widest`}>
                      {new Date(contract.updated_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setViewingContract(contract)}
                        className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(contract)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(contract)}
                        className={`p-1.5 rounded-lg transition ${contract.is_active
                          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        title={contract.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {contract.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {contracts.length === 0 && (
            <div className={`text-center py-20 ${textSecondary}`}>
              <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-[0.2em] text-xs">No active protocols found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {contracts.map((contract) => (
            <div key={contract.id} className={`${cardBg} rounded-2xl shadow-lg border ${borderColor} p-4 hover:border-cyan-500/50 transition duration-300 group`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${textPrimary} group-hover:text-cyan-500 transition`}>
                      {getContractTypeLabel(contract.contract_type)}
                    </h3>
                  </div>
                  <p className={`text-sm font-bold ${textPrimary} mb-2 leading-tight`}>{contract.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-gray-100 dark:bg-gray-700 ${textSecondary}`}>
                      v{contract.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${contract.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {contract.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`text-[9px] font-bold ${textSecondary} mb-4 p-3 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl flex items-center gap-2 border ${borderColor}`}>
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                <div className="flex flex-col">
                  <span className="uppercase tracking-[0.1em] opacity-50">Sync</span>
                  <span className={textPrimary}>{new Date(contract.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setViewingContract(contract)}
                  className="p-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition flex items-center justify-center"
                  title="View"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(contract)}
                  className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition flex items-center justify-center"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(contract)}
                  className={`p-2 rounded-lg transition flex items-center justify-center ${contract.is_active
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40'
                    }`}
                  title={contract.is_active ? 'Deactivate' : 'Activate'}
                >
                  {contract.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}

          {contracts.length === 0 && (
            <div className={`text-center py-20 ${textSecondary} col-span-full`}>
               <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-20" />
               <p className="font-bold uppercase tracking-[0.2em] text-xs">No active protocols found.</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`${cardBg} rounded-[1.5rem] shadow-2xl max-w-2xl w-full my-4 border ${borderColor} animate-in zoom-in-95 duration-300 overflow-hidden`}>
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between bg-gradient-to-r from-cyan-600/10 to-transparent`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                  <FileCheck className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                   <h2 className={`text-lg font-black ${textPrimary} uppercase tracking-tighter`}>Create Protocol</h2>
                   <p className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest`}>New legal documentation segment</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className={`${textSecondary} hover:text-gray-600 transition p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    1. Identity / Type *
                  </label>
                  <select
                    required
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-bold text-xs transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                  >
                    <option value="terms_and_conditions">Terms & Conditions</option>
                    <option value="privacy_policy">Privacy Policy</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    2. Sequence / Version *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-bold text-xs transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                    placeholder="e.g. 1.0.0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    3. Formal Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-bold text-xs transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                    placeholder="e.g. Master Operations Agreement"
                  />
                </div>

                <div className="md:col-span-2">
                   <div className="flex items-center justify-between mb-2">
                      <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary}`}>
                        4. Documentation Content * (Markdown)
                      </label>
                   </div>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 font-mono text-xs leading-relaxed transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                    placeholder="Paste legal markdown content here..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t ${borderColor}">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className={`px-4 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-black text-[9px] uppercase tracking-widest`}
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {loading ? 'Wait...' : 'Deploy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`${cardBg} rounded-[1.5rem] shadow-2xl max-w-2xl w-full my-4 border ${borderColor} overflow-hidden`}>
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                   <h2 className={`text-lg font-black ${textPrimary} uppercase tracking-tighter`}>Refine Protocol</h2>
                   <p className={`text-[9px] font-black ${textSecondary} uppercase tracking-widest`}>Update documentation v{editingContract.version}</p>
                </div>
              </div>
              <button onClick={() => setEditingContract(null)} className={`${textSecondary} hover:text-gray-600 transition p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full`}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    Identity / Protocol Type
                  </label>
                  <input
                    type="text"
                    value={getContractTypeLabel(editingContract.contract_type)}
                    disabled
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest`}
                  />
                </div>

                <div>
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    Sequence / Version *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-xs transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-[9px] font-black uppercase tracking-[0.1em] ${textSecondary} mb-2`}>
                    Formal Designation / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-xs transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                  />
                </div>

                <div className="md:col-span-2">
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-xs leading-relaxed transition ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t ${borderColor}">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className={`px-4 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-black text-[9px] uppercase tracking-widest`}
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {loading ? 'Wait...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className={`${cardBg} rounded-[1.5rem] shadow-2xl max-w-2xl w-full my-4 border ${borderColor} overflow-hidden`}>
            <div className={`p-5 border-b ${borderColor} flex items-center justify-between bg-white dark:bg-slate-800`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <FileCheck className="h-5 w-5 text-cyan-500" />
                   <h2 className={`text-lg font-black ${textPrimary} uppercase tracking-tighter`}>
                      {viewingContract.title}
                   </h2>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                  <span className={textSecondary}>Revision v{viewingContract.version}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full ${viewingContract.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {viewingContract.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingContract(null)}
                className={`${textSecondary} hover:text-gray-600 transition p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto bg-gray-50/30 dark:bg-gray-900/30">
              <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                <div className="whitespace-pre-wrap font-medium text-gray-700 dark:text-gray-300 leading-relaxed font-roboto text-xs">
                  {viewingContract.content}
                </div>
              </div>
            </div>

            <div className={`p-4 border-t ${borderColor} bg-gray-50 dark:bg-gray-800/50 flex justify-end`}>
               <button
                  onClick={() => setViewingContract(null)}
                  className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-black text-[9px] uppercase tracking-widest active:scale-95 transition"
               >
                  Close
               </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
