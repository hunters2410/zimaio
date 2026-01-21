import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Settings,
    Save,
    X,
    Check,
    AlertCircle,
    Globe,
    Mail,
    Phone,
    Layout,
    Share2,
    Lock,
    Eye,
    Type
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SiteSetting {
    id: string;
    setting_key: string;
    setting_value: string;
    setting_type: string;
}

export function SystemConfigurations() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<Record<string, string>>({});

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*');

            if (error) throw error;
            setSettings(data || []);

            const initialData: Record<string, string> = {};
            data?.forEach(s => {
                initialData[s.setting_key] = s.setting_value;
            });
            setFormData(initialData);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updates = Object.entries(formData).map(([key, value]) => ({
                setting_key: key,
                setting_value: value,
                updated_at: new Date().toISOString()
            }));

            // In a real app, you might want to use a stored procedure or multiple updates
            for (const update of updates) {
                await supabase
                    .from('site_settings')
                    .update({ setting_value: update.setting_value })
                    .eq('setting_key', update.setting_key);
            }

            setMessage({ type: 'success', text: 'Settings updated successfully' });
            fetchSettings();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const ConfigSection = ({ title, icon: Icon, children }: any) => (
        <div className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden mb-8`}>
            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 bg-gray-50/50 dark:bg-gray-700/50">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-indigo-600">
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className={`text-xl font-black uppercase tracking-tight ${textPrimary}`}>{title}</h3>
            </div>
            <div className="p-10 space-y-8">
                {children}
            </div>
        </div>
    );

    const InputField = ({ label, id, type = "text", placeholder }: any) => (
        <div className="relative">
            <label htmlFor={id} className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3 ml-2`}>{label}</label>
            <input
                type={type}
                id={id}
                value={formData[id] || ''}
                onChange={(e) => handleChange(id, e.target.value)}
                placeholder={placeholder}
                className={`w-full px-8 py-4 rounded-[24px] border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
            />
        </div>
    );

    return (
        <AdminLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>System Configurations</h1>
                    </div>
                    <p className={textSecondary}>Configure global platform parameters, contact info, and security settings.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-10 py-4 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : <><Save className="h-5 w-5" /> Save Changes</>}
                </button>
            </div>

            {message && (
                <div className={`mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                    } border`}>
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-bold flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)}><X className="h-5 w-5" /></button>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <form onSubmit={handleSave} className="max-w-5xl">
                    <ConfigSection title="General Information" icon={Globe}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Site Name" id="site_name" placeholder="ZimAIO Marketplace" />
                            <InputField label="Site Tagline" id="site_tagline" placeholder="Everything you need, all in one place" />
                            <div className="md:col-span-2">
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3 ml-2`}>Footer Text</label>
                                <textarea
                                    value={formData['footer_text'] || ''}
                                    onChange={(e) => handleChange('footer_text', e.target.value)}
                                    rows={3}
                                    className={`w-full px-8 py-4 rounded-[24px] border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
                                />
                            </div>
                        </div>
                    </ConfigSection>

                    <ConfigSection title="Contact & Support" icon={Mail}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputField label="Support Email" id="support_email" type="email" placeholder="support@zimaio.com" />
                            <InputField label="Sales Email" id="sales_email" type="email" placeholder="sales@zimaio.com" />
                            <InputField label="Contact Phone" id="contact_phone" placeholder="+263 77 123 4567" />
                            <InputField label="Office Address" id="office_address" placeholder="123 Samora Machel Ave, Harare" />
                        </div>
                    </ConfigSection>

                    <ConfigSection title="Social Media Links" icon={Share2}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <InputField label="Facebook" id="facebook_url" placeholder="https://facebook.com/zimaio" />
                            <InputField label="Twitter/X" id="twitter_url" placeholder="https://twitter.com/zimaio" />
                            <InputField label="Instagram" id="instagram_url" placeholder="https://instagram.com/zimaio" />
                        </div>
                    </ConfigSection>

                    <ConfigSection title="Appearance & Branding" icon={Layout}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3 ml-2`}>Default Font</label>
                                <select
                                    value={formData['font_family'] || 'Inter'}
                                    onChange={(e) => handleChange('font_family', e.target.value)}
                                    className={`w-full px-8 py-4 rounded-[24px] border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
                                >
                                    <option value="Inter">Inter (Modern)</option>
                                    <option value="Poppins">Poppins (Friendly)</option>
                                    <option value="Montserrat">Montserrat (Geometric)</option>
                                    <option value="Roboto">Roboto (Clean)</option>
                                </select>
                            </div>
                            <InputField label="Logo URL" id="site_logo" placeholder="https://zimaio.com/logo.png" />
                        </div>
                    </ConfigSection>

                    <ConfigSection title="Security & API" icon={Lock}>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-gray-900/40 rounded-[32px] border ${borderColor}">
                                <div>
                                    <h4 className={`text-sm font-black uppercase tracking-tight ${textPrimary}`}>Maintenance Mode</h4>
                                    <p className={`text-[10px] ${textSecondary} uppercase font-bold`}>Take the platform offline for updates</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleChange('maintenance_mode', formData['maintenance_mode'] === 'true' ? 'false' : 'true')}
                                    className={`w-16 h-8 rounded-full p-1 transition-all ${formData['maintenance_mode'] === 'true' ? 'bg-rose-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${formData['maintenance_mode'] === 'true' ? 'translate-x-8' : ''}`} />
                                </button>
                            </div>
                            <InputField label="Google Analytics ID" id="ga_id" placeholder="G-XXXXXXXXXX" />
                        </div>
                    </ConfigSection>
                </form>
            )}
        </AdminLayout>
    );
}
