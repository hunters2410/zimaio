import { useEffect, useState } from 'react';
import { Type, Palette, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: string;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
];

export function AppearanceSettings() {
  const [fontFamily, setFontFamily] = useState('Inter');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('setting_key', 'font_family')
      .maybeSingle();

    if (data) {
      setFontFamily(data.setting_value);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('site_settings')
      .update({
        setting_value: fontFamily,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'font_family');

    if (error) {
      setMessage('Error saving settings');
    } else {
      setMessage('Settings saved successfully! Refresh the page to see changes.');
      document.body.style.fontFamily = `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`;
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Appearance Settings</h1>
          <p className="text-green-100">Customize the look and feel of your site</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.includes('Error')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <Type className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Font Settings</h2>
                <p className="text-sm text-gray-600">Choose the font family for your site</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div style={{ fontFamily: `'${fontFamily}', sans-serif` }}>
                  <p className="text-base mb-2">The quick brown fox jumps over the lazy dog</p>
                  <p className="text-lg mb-2 font-semibold">Welcome to ZimAIO Marketplace</p>
                  <p className="text-sm">1234567890 !@#$%^&*()</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <Palette className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Color Scheme</h2>
                <p className="text-sm text-gray-600">Current primary color: Green</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-semibold">
                Primary
              </div>
              <div className="flex-1 h-16 bg-green-600 rounded-lg flex items-center justify-center text-white font-semibold">
                Hover
              </div>
              <div className="flex-1 h-16 bg-green-700 rounded-lg flex items-center justify-center text-white font-semibold">
                Active
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
