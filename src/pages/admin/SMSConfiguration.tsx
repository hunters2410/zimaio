import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Save, Key, AlertCircle } from 'lucide-react';
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
  { value: 'africastalking', label: 'Africa\'s Talking' },
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

  async function loadConfigs() {
    try {
      const { data, error } = await supabase
        .from('sms_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);

      if (data && data.length > 0) {
        const config = data[0];
        setFormData({
          provider: config.provider,
          api_key: config.api_key || '',
          sender_id: config.sender_id || '',
          is_active: config.is_active,
          settings: JSON.stringify(config.settings || {}, null, 2)
        });
      }
    } catch (error) {
      console.error('Error loading SMS configs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      let settings;
      try {
        settings = JSON.parse(formData.settings);
      } catch {
        alert('Invalid JSON format in settings');
        setSaving(false);
        return;
      }

      const payload = {
        provider: formData.provider,
        api_key: formData.api_key,
        sender_id: formData.sender_id,
        is_active: formData.is_active,
        settings
      };

      if (configs.length > 0) {
        const { error } = await supabase
          .from('sms_configurations')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', configs[0].id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sms_configurations')
          .insert([payload]);

        if (error) throw error;
      }

      alert('SMS configuration saved successfully');
      loadConfigs();
    } catch (error) {
      console.error('Error saving SMS config:', error);
      alert('Failed to save SMS configuration');
    } finally {
      setSaving(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
          <MessageSquare className="w-8 h-8 mr-3 text-blue-600" />
          SMS Configuration
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Configure SMS gateway for sending text messages
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Important Security Note</p>
            <p>API keys and sensitive credentials are stored securely. Never share your API keys or include them in client-side code.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            SMS Provider *
          </label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            {smsProviders.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            API Key / Access Token *
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              required
              placeholder="Enter your API key"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your API key from the SMS provider dashboard
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Sender ID / Phone Number *
          </label>
          <input
            type="text"
            value={formData.sender_id}
            onChange={(e) => setFormData({ ...formData, sender_id: e.target.value })}
            required
            placeholder="MyApp or +1234567890"
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            The sender name or phone number recipients will see
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Additional Settings (JSON)
          </label>
          <textarea
            value={formData.settings}
            onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
            rows={6}
            placeholder='{\n  "account_sid": "your_account_sid",\n  "region": "us-east-1",\n  "timeout": 30\n}'
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white font-mono text-sm"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provider-specific configuration options in JSON format
          </p>
        </div>

        <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Enable SMS notifications</span>
          </label>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Provider Setup Guides
        </h3>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <strong className="text-slate-900 dark:text-white">Twilio:</strong>
            <p className="mt-1">1. Sign up at twilio.com</p>
            <p>2. Get your Account SID and Auth Token from the dashboard</p>
            <p>3. Purchase a phone number or register a sender ID</p>
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">Africa's Talking:</strong>
            <p className="mt-1">1. Create an account at africastalking.com</p>
            <p>2. Generate an API key from your account settings</p>
            <p>3. Request a sender ID approval for your use case</p>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
