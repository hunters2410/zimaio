import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Percent, Save, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface VATSettings {
  id: string;
  is_enabled: boolean;
  default_rate: number;
  applies_to_products: boolean;
  applies_to_shipping: boolean;
  commission_enabled: boolean;
  commission_rate: number;
}

interface ProductVATOverride {
  id: string;
  product_id: string;
  vat_rate: number;
  vat_exempt: boolean;
  product?: {
    name: string;
    vendor?: {
      shop_name: string;
    };
  };
}

export function VATManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [settings, setSettings] = useState<VATSettings | null>(null);
  const [overrides, setOverrides] = useState<ProductVATOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: vatData, error: vatError } = await supabase
        .from('vat_settings')
        .select('*')
        .single();

      if (vatError) throw vatError;
      setSettings(vatData);

      const { data: overridesData, error: overridesError } = await supabase
        .from('product_vat_overrides')
        .select(`
          *,
          product:products(
            name,
            vendor:vendor_profiles(shop_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (overridesError) throw overridesError;
      setOverrides(overridesData || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('vat_settings')
        .update({
          is_enabled: settings.is_enabled,
          default_rate: settings.default_rate,
          applies_to_products: settings.applies_to_products,
          applies_to_shipping: settings.applies_to_shipping,
          commission_enabled: settings.commission_enabled,
          commission_rate: settings.commission_rate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'VAT settings saved successfully' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    if (!confirm('Remove this VAT override?')) return;

    try {
      const { error } = await supabase
        .from('product_vat_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'VAT override removed' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
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
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Percent className="h-6 w-6 text-cyan-600" />
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>VAT Management</h1>
            <p className={`text-sm ${textSecondary}`}>Configure value-added tax settings</p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {settings && (
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4 mb-6`}>
          <h2 className={`text-base font-semibold ${textPrimary} mb-4`}>Global VAT Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-sm font-medium ${textPrimary}`}>Enable VAT</label>
                <p className={`text-xs ${textSecondary}`}>Apply VAT to transactions</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, is_enabled: !settings.is_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.is_enabled ? 'bg-cyan-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.is_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div>
              <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                Default VAT Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.default_rate}
                onChange={(e) => setSettings({ ...settings, default_rate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className={`text-sm font-medium ${textPrimary}`}>Apply to Products</label>
                <p className={`text-xs ${textSecondary}`}>Include VAT in product prices</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, applies_to_products: !settings.applies_to_products })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.applies_to_products ? 'bg-cyan-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.applies_to_products ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className={`text-sm font-medium ${textPrimary}`}>Apply to Shipping</label>
                <p className={`text-xs ${textSecondary}`}>Include VAT in shipping costs</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, applies_to_shipping: !settings.applies_to_shipping })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.applies_to_shipping ? 'bg-cyan-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.applies_to_shipping ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {settings && (
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4 mb-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Percent className="h-5 w-5 text-emerald-600" />
            <h2 className={`text-base font-semibold ${textPrimary}`}>Handling Fee Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className={`text-sm font-medium ${textPrimary}`}>Enable Commission</label>
                <p className={`text-xs ${textSecondary}`}>Add admin commission on top of vendor products</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, commission_enabled: !settings.commission_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${settings.commission_enabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${settings.commission_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
            </div>

            <div>
              <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.commission_rate}
                onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) || 0 })}
                className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Handling Fee Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base font-semibold ${textPrimary}`}>Product VAT Overrides</h2>
          <span className={`text-xs ${textSecondary}`}>{overrides.length} overrides</span>
        </div>

        {overrides.length === 0 ? (
          <p className={`text-sm ${textSecondary} text-center py-8`}>
            No product-specific VAT overrides configured
          </p>
        ) : (
          <div className="space-y-2">
            {overrides.map((override) => (
              <div
                key={override.id}
                className={`flex items-center justify-between p-3 border ${borderColor} rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-medium ${textPrimary}`}>
                    {override.product?.name || 'Unknown Product'}
                  </p>
                  <p className={`text-xs ${textSecondary}`}>
                    {override.product?.vendor?.shop_name || 'Unknown Vendor'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {override.vat_exempt ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      VAT Exempt
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {override.vat_rate}%
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteOverride(override.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition dark:hover:bg-red-900/30"
                    title="Remove override"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
