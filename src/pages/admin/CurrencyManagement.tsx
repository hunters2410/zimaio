import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchange_rate: 1,
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    loadCurrencies();
  }, []);

  async function loadCurrencies() {
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('code');

      if (error) throw error;
      setCurrencies(data || []);
    } catch (error) {
      console.error('Error loading currencies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('currencies')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('currencies')
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      loadCurrencies();
    } catch (error) {
      console.error('Error saving currency:', error);
      alert('Failed to save currency');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this currency?')) return;

    try {
      const { error } = await supabase
        .from('currencies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadCurrencies();
    } catch (error) {
      console.error('Error deleting currency:', error);
      alert('Failed to delete currency');
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('currencies')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadCurrencies();
    } catch (error) {
      console.error('Error toggling currency status:', error);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await supabase
        .from('currencies')
        .update({ is_default: false });

      const { error } = await supabase
        .from('currencies')
        .update({
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadCurrencies();
    } catch (error) {
      console.error('Error setting default currency:', error);
    }
  }

  function handleEdit(currency: Currency) {
    setEditingId(currency.id);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      exchange_rate: currency.exchange_rate,
      is_active: currency.is_active,
      is_default: currency.is_default
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      code: '',
      name: '',
      symbol: '',
      exchange_rate: 1,
      is_active: true,
      is_default: false
    });
    setEditingId(null);
    setShowForm(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-blue-600" />
              Currency Management
            </h1>
            <p className="text-slate-600 mt-1">Manage currencies and exchange rates</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </button>
        </div>

        {showForm && (
          <div className="bg-gray-50 rounded p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Currency' : 'Add Currency'}
              </h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    maxLength={3}
                    required
                    placeholder="USD"
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="US Dollar"
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Symbol *</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    required
                    placeholder="$"
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-0.5">Rate *</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.exchange_rate}
                    onChange={(e) => setFormData({ ...formData, exchange_rate: parseFloat(e.target.value) })}
                    required
                    placeholder="1.0"
                    className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-1 text-slate-700">Active</span>
                </label>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-1 text-slate-700">Default</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={resetForm} className="px-3 py-1 text-slate-700 hover:bg-slate-100 rounded transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                  <Save className="w-3 h-3 mr-1" />
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-gray-50 rounded shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Code</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Rate</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Default</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap"><span className="text-sm font-medium text-slate-900">{currency.code}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap"><span className="text-sm text-slate-700">{currency.name}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap"><span className="text-sm text-slate-700">{currency.symbol}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap"><span className="text-sm text-slate-700">{currency.exchange_rate}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(currency.id, currency.is_active)}
                        className={`px-2 py-0.5 text-xs rounded-full ${currency.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {currency.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {currency.is_default ? (
                        <span className="flex items-center text-sm text-green-600">
                          <Check className="w-3 h-3 mr-1" /> Default
                        </span>
                      ) : (
                        <button onClick={() => handleSetDefault(currency.id)} className="text-sm text-blue-600 hover:text-blue-700">
                          Set Default
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(currency)} className="text-blue-600 hover:text-blue-700 mr-2">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(currency.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currencies.length === 0 && (
            <div className="text-center py-8 text-slate-500">No currencies found. Add your first currency.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
