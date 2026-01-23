import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Key } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface SMSConfig {
  id: string;
  provider: string;
  api_key: string;
  sender_id: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

const smsProviders = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'africastalking', label: "Africa's Talking" },
  { value: 'nexmo', label: 'Nexmo/Vonage' },
  { value: 'messagebird', label: 'MessageBird' },
  { value: 'custom', label: 'Custom Provider' }
];

export default function SMSConfiguration() {
  const [configs, setConfigs] = useState<SMSConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'twilio',
    api_key: '',
    sender_id: '',
    is_active: true,
    settings: '{}'
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_configurations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setConfigs(data || []);
      if (data && data.length > 0) {
        const cfg = data[0];
        setFormData({
          provider: cfg.provider,
          api_key: cfg.api_key || '',
          sender_id: cfg.sender_id || '',
          is_active: cfg.is_active,
          settings: JSON.stringify(cfg.settings || {}, null, 2)
        });
      }
    } catch (e) {
      console.error('Error loading SMS configs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = JSON.parse(formData.settings);
      const payload = { ...formData, settings };
      if (configs.length > 0) {
        const { error } = await supabase
          .from('sms_configurations')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', configs[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('sms_configurations').insert([payload]);
        if (error) throw error;
      }
      alert('SMS configuration saved');
      loadConfigs();
    } catch (e) {
      console.error('Error saving SMS config:', e);
      alert('Failed to save SMS configuration');
    } finally {
      setSaving(false);
    }
  };

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
              <MessageSquare className="w-6 h-6 mr-2 text-blue-600" />
              SMS Configuration
            </h1>
            <p className="text-slate-600 mt-1">Configure SMS gateway for sending text messages</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-4 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Provider *</label>
                <select
                  value={formData.provider}
                  onChange={e => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                >
                  {smsProviders.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">API Key *</label>
                <div className="relative">
                  <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full pl-8 pr-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Sender ID *</label>
                <input
                  type="text"
                  value={formData.sender_id}
                  onChange={e => setFormData({ ...formData, sender_id: e.target.value })}
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Enable SMS notifications</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-0.5">Additional Settings (JSON)</label>
              <textarea
                rows={4}
                value={formData.settings}
                onChange={e => setFormData({ ...formData, settings: e.target.value })}
                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white font-mono text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ provider: 'twilio', api_key: '', sender_id: '', is_active: true, settings: '{}' })}
                className="px-3 py-1 text-slate-700 hover:bg-slate-100 rounded transition-colors text-sm"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
