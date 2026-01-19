import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Globe, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string | null;
  is_active: boolean;
  is_default: boolean;
  translations: any;
  created_at: string;
  updated_at: string;
}

export default function LanguageManagement() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    native_name: '',
    is_active: true,
    is_default: false
  });

  useEffect(() => {
    loadLanguages();
  }, []);

  async function loadLanguages() {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('code');

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('languages')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('languages')
          .insert([formData]);

        if (error) throw error;
      }

      resetForm();
      loadLanguages();
    } catch (error) {
      console.error('Error saving language:', error);
      alert('Failed to save language');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this language?')) return;

    try {
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      alert('Failed to delete language');
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('languages')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadLanguages();
    } catch (error) {
      console.error('Error toggling language status:', error);
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await supabase
        .from('languages')
        .update({ is_default: false });

      const { error } = await supabase
        .from('languages')
        .update({
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadLanguages();
    } catch (error) {
      console.error('Error setting default language:', error);
    }
  }

  function handleEdit(language: Language) {
    setEditingId(language.id);
    setFormData({
      code: language.code,
      name: language.name,
      native_name: language.native_name || '',
      is_active: language.is_active,
      is_default: language.is_default
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      code: '',
      name: '',
      native_name: '',
      is_active: true,
      is_default: false
    });
    setEditingId(null);
    setShowForm(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <Globe className="w-8 h-8 mr-3 text-blue-600" />
            Language Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage languages and translations
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Language
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editingId ? 'Edit Language' : 'Add New Language'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Language Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                  maxLength={5}
                  required
                  placeholder="en"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ISO 639-1 code (e.g., en, es, fr, de)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Language Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="English"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Native Name
                </label>
                <input
                  type="text"
                  value={formData.native_name}
                  onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                  placeholder="English (native script)"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Language name in its native script (optional)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Default Language</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Native Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {languages.map((language) => (
                <tr key={language.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {language.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {language.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {language.native_name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(language.id, language.is_active)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        language.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {language.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {language.is_default ? (
                      <span className="flex items-center text-sm text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4 mr-1" />
                        Default
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(language.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Set as Default
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(language)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mr-3"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(language.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {languages.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            No languages found. Add your first language to get started.
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
