import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, AlertCircle, Globe, Mail, Phone, Layout, Share2, Lock, Upload, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';

interface SiteSetting {
    id: string;
    setting_key: string;
    setting_value: string;
    setting_type: string;
}

export function SystemConfigurations() {
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('site_settings').select('*');
            if (error) throw error;
            setSettings(data || []);
            const initial: Record<string, string> = {};
            data?.forEach(s => {
                initial[s.setting_key] = s.setting_value;
            });
            setFormData(initial);
        } catch (e: any) {
            setMessage({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            // Update each setting
            for (const [key, value] of Object.entries(formData)) {
                const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                        setting_key: key,
                        setting_value: value,
                        setting_type: key.includes('email') ? 'email' : key.includes('url') || key.includes('logo') ? 'url' : key === 'maintenance_mode' ? 'boolean' : 'text'
                    }, {
                        onConflict: 'setting_key'
                    });

                if (error) throw error;
            }

            setMessage({ type: 'success', text: 'Settings saved successfully! Changes will take effect immediately.' });
            fetchSettings();
        } catch (e: any) {
            setMessage({ type: 'error', text: `Failed to save: ${e.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload an image file' });
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 2MB' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const filePath = `logos/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            // Update form data and save to database
            setFormData(prev => ({ ...prev, site_logo: publicUrl }));

            // Save to database immediately
            const { error: dbError } = await supabase
                .from('site_settings')
                .upsert({
                    setting_key: 'site_logo',
                    setting_value: publicUrl,
                    setting_type: 'image'
                }, {
                    onConflict: 'setting_key'
                });

            if (dbError) throw dbError;

            // Record upload in uploads table
            await supabase.from('uploads').insert({
                file_name: fileName,
                file_path: publicUrl,
                file_type: file.type,
                file_size: file.size,
                upload_type: 'logo'
            });

            setMessage({ type: 'success', text: 'Logo uploaded successfully! It will appear across the site.' });
            fetchSettings();
        } catch (e: any) {
            setMessage({ type: 'error', text: `Upload failed: ${e.message}` });
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const ConfigSection = ({ title, icon: Icon, children }: any) => (
        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-4">
            <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-100">
                <div className="p-1 bg-white rounded text-indigo-600">
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            </div>
            <div className="p-3 space-y-3">{children}</div>
        </div>
    );

    const InputField = ({ label, id, type = 'text', placeholder }: any) => (
        <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
            <input
                type={type}
                id={id}
                value={formData[id] || ''}
                onChange={e => handleChange(id, e.target.value)}
                placeholder={placeholder}
                className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
            />
        </div>
    );

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                            <Settings className="w-6 h-6 mr-2 text-indigo-600" />
                            System Configurations
                        </h1>
                        <p className="text-slate-600 text-sm mt-1">Manage site-wide settings and branding</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>

                {message && (
                    <div className={`p-3 rounded flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'}`}>
                        <AlertCircle className="w-4 h-4" />
                        <span>{message.text}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="space-y-4">
                        <ConfigSection title="Site Branding" icon={ImageIcon}>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Site Logo</label>
                                <div className="flex items-center gap-3">
                                    {formData['site_logo'] && (
                                        <img
                                            src={formData['site_logo']}
                                            alt="Site Logo"
                                            className="h-12 w-auto object-contain bg-white border border-gray-200 rounded p-1"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={uploading}
                                            className="hidden"
                                            id="logo-upload"
                                        />
                                        <label
                                            htmlFor="logo-upload"
                                            className={`inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Upload className="w-4 h-4" />
                                            {uploading ? 'Uploading...' : 'Upload New Logo'}
                                        </label>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG or SVG. Max 2MB.</p>
                                    </div>
                                </div>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="General Information" icon={Globe}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField label="Site Name" id="site_name" placeholder="ZimAIO Marketplace" />
                                <InputField label="Site Tagline" id="site_tagline" placeholder="Everything you need, all in one place" />
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Footer Text</label>
                                    <textarea
                                        value={formData['footer_text'] || ''}
                                        onChange={e => handleChange('footer_text', e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                    />
                                </div>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Contact & Support" icon={Mail}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InputField label="Support Email" id="support_email" type="email" placeholder="support@zimaio.com" />
                                <InputField label="Sales Email" id="sales_email" type="email" placeholder="sales@zimaio.com" />
                                <InputField label="Contact Phone" id="contact_phone" placeholder="+263 77 123 4567" />
                                <InputField label="Office Address" id="office_address" placeholder="123 Samora Machel Ave, Harare" />
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Social Media Links" icon={Share2}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <InputField label="Facebook" id="facebook_url" placeholder="https://facebook.com/zimaio" />
                                <InputField label="Twitter/X" id="twitter_url" placeholder="https://twitter.com/zimaio" />
                                <InputField label="Instagram" id="instagram_url" placeholder="https://instagram.com/zimaio" />
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Appearance" icon={Layout}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Default Font</label>
                                    <select
                                        value={formData['font_family'] || 'Inter'}
                                        onChange={e => handleChange('font_family', e.target.value)}
                                        className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                                    >
                                        <option value="Inter">Inter (Modern)</option>
                                        <option value="Poppins">Poppins (Friendly)</option>
                                        <option value="Montserrat">Montserrat (Geometric)</option>
                                        <option value="Roboto">Roboto (Clean)</option>
                                    </select>
                                </div>
                            </div>
                        </ConfigSection>

                        <ConfigSection title="Security & Advanced" icon={Lock}>
                            <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-900">Maintenance Mode</h4>
                                    <p className="text-xs text-slate-600">Take the platform offline for updates</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleChange('maintenance_mode', formData['maintenance_mode'] === 'true' ? 'false' : 'true')}
                                    className={`w-12 h-6 rounded-full p-0.5 transition ${formData['maintenance_mode'] === 'true' ? 'bg-rose-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData['maintenance_mode'] === 'true' ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                            <InputField label="Google Analytics ID" id="ga_id" placeholder="G-XXXXXXXXXX" />
                        </ConfigSection>
                    </form>
                )}
            </div>
        </AdminLayout>
    );
}
