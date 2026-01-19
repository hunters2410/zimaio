import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Save, Key, AlertCircle } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface EmailConfig {
  id: string;
  provider: string;
  smtp_host: string;
  smtp_port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

const emailProviders = [
  { value: 'smtp', label: 'SMTP (Generic)' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'Amazon SES' },
  { value: 'postmark', label: 'Postmark' },
  { value: 'mailchimp', label: 'Mailchimp' }
];

export default function EmailConfiguration() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    is_active: true,
    settings: '{}'
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      const { data, error } = await supabase
        .from('email_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);

      if (data && data.length > 0) {
        const config = data[0];
        setFormData({
          provider: config.provider,
          smtp_host: config.smtp_host || '',
          smtp_port: config.smtp_port || 587,
          username: config.username || '',
          password: config.password || '',
          from_email: config.from_email || '',
          from_name: config.from_name || '',
          is_active: config.is_active,
          settings: JSON.stringify(config.settings || {}, null, 2)
        });
      }
    } catch (error) {
      console.error('Error loading email configs:', error);
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
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        username: formData.username,
        password: formData.password,
        from_email: formData.from_email,
        from_name: formData.from_name,
        is_active: formData.is_active,
        settings
      };

      if (configs.length > 0) {
        const { error } = await supabase
          .from('email_configurations')
          .update({
            ...payload,
            updated_at: new Date().toISOString()
          })
          .eq('id', configs[0].id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_configurations')
          .insert([payload]);

        if (error) throw error;
      }

      alert('Email configuration saved successfully');
      loadConfigs();
    } catch (error) {
      console.error('Error saving email config:', error);
      alert('Failed to save email configuration');
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
          <Mail className="w-8 h-8 mr-3 text-blue-600" />
          Email Configuration
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Configure email server for sending transactional emails
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Important Security Note</p>
            <p>SMTP credentials and API keys are stored securely. Never share your credentials or include them in client-side code.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email Provider *
          </label>
          <select
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          >
            {emailProviders.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              SMTP Host *
            </label>
            <input
              type="text"
              value={formData.smtp_host}
              onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
              required
              placeholder="smtp.example.com"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              SMTP Port *
            </label>
            <input
              type="number"
              value={formData.smtp_port}
              onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
              required
              placeholder="587"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Common ports: 587 (TLS), 465 (SSL), 25 (Plain)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Username / API Key *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="user@example.com or API key"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password / API Secret *
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Email *
            </label>
            <input
              type="email"
              value={formData.from_email}
              onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
              required
              placeholder="noreply@example.com"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The email address emails will be sent from
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Name *
            </label>
            <input
              type="text"
              value={formData.from_name}
              onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
              required
              placeholder="My Company"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The sender name recipients will see
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Additional Settings (JSON)
          </label>
          <textarea
            value={formData.settings}
            onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
            rows={6}
            placeholder='{\n  "secure": true,\n  "tls": {\n    "rejectUnauthorized": false\n  },\n  "timeout": 30000\n}'
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
            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Enable email notifications</span>
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
            <strong className="text-slate-900 dark:text-white">Gmail/Google Workspace:</strong>
            <p className="mt-1">Host: smtp.gmail.com, Port: 587</p>
            <p>Enable 2FA and create an App Password for authentication</p>
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">SendGrid:</strong>
            <p className="mt-1">Host: smtp.sendgrid.net, Port: 587</p>
            <p>Username: apikey, Password: Your SendGrid API key</p>
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">Mailgun:</strong>
            <p className="mt-1">Host: smtp.mailgun.org, Port: 587</p>
            <p>Use your Mailgun SMTP credentials from the dashboard</p>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
