import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Save, Key, Send, CheckCircle, XCircle } from 'lucide-react';
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
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
        const cfg = data[0];
        setFormData({
          provider: cfg.provider,
          smtp_host: cfg.smtp_host || '',
          smtp_port: cfg.smtp_port || 587,
          username: cfg.username || '',
          password: cfg.password || '',
          from_email: cfg.from_email || '',
          from_name: cfg.from_name || '',
          is_active: cfg.is_active,
          settings: JSON.stringify(cfg.settings || {}, null, 2)
        });
      }
    } catch (e) {
      console.error('Error loading email configs:', e);
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
        alert('Invalid JSON in settings');
        setSaving(false);
        return;
      }
      const payload = { ...formData, settings };
      if (configs.length > 0) {
        const { error } = await supabase
          .from('email_configurations')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', configs[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('email_configurations').insert([payload]);
        if (error) throw error;
      }
      alert('Email configuration saved');
      loadConfigs();
    } catch (e) {
      console.error('Error saving email config:', e);
      alert('Failed to save email configuration');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail) {
      setTestMessage({ type: 'error', text: 'Please enter a test email address' });
      return;
    }

    setTestSending(true);
    setTestMessage(null);

    try {
      // Call your backend API endpoint to send test email
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          config: formData
        })
      });

      if (response.ok) {
        setTestMessage({ type: 'success', text: `Test email sent successfully to ${testEmail}` });
        setTestEmail('');
      } else {
        const error = await response.json();
        setTestMessage({ type: 'error', text: error.message || 'Failed to send test email' });
      }
    } catch (e: any) {
      setTestMessage({ type: 'error', text: 'Failed to send test email. Please check your configuration.' });
    } finally {
      setTestSending(false);
    }
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
              <Mail className="w-6 h-6 mr-2 text-blue-600" />
              Email Configuration
            </h1>
            <p className="text-slate-600 mt-1 text-sm">Configure email server for transactional emails</p>
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
                  {emailProviders.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">SMTP Host *</label>
                <input
                  type="text"
                  value={formData.smtp_host}
                  onChange={e => setFormData({ ...formData, smtp_host: e.target.value })}
                  required
                  placeholder="smtp.example.com"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">SMTP Port *</label>
                <input
                  type="number"
                  value={formData.smtp_port}
                  onChange={e => setFormData({ ...formData, smtp_port: parseInt(e.target.value) })}
                  required
                  placeholder="587"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Username / API Key *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                  placeholder="user@example.com or API key"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">Password / API Secret *</label>
                <div className="relative">
                  <Key className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter password"
                    className="w-full pl-8 pr-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">From Email *</label>
                <input
                  type="email"
                  value={formData.from_email}
                  onChange={e => setFormData({ ...formData, from_email: e.target.value })}
                  required
                  placeholder="noreply@example.com"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-0.5">From Name *</label>
                <input
                  type="text"
                  value={formData.from_name}
                  onChange={e => setFormData({ ...formData, from_name: e.target.value })}
                  required
                  placeholder="My Company"
                  className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-3 h-3 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Enable email notifications</span>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setFormData({ provider: 'smtp', smtp_host: '', smtp_port: 587, username: '', password: '', from_email: '', from_name: '', is_active: true, settings: '{}' })}
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

        {/* Test Email Section */}
        <div className="bg-blue-50 rounded p-4 border border-blue-200">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center">
            <Send className="w-4 h-4 mr-2 text-blue-600" />
            Test Email Configuration
          </h3>
          <p className="text-xs text-slate-600 mb-3">Send a test email to verify your configuration is working correctly</p>

          {testMessage && (
            <div className={`mb-3 p-2 rounded flex items-center gap-2 text-sm ${testMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {testMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{testMessage.text}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="Enter test email address"
              className="flex-1 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white text-sm"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={testSending || !testEmail}
              className="flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              <Send className="w-4 h-4 mr-1" />
              {testSending ? 'Sending...' : 'Send Test'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
