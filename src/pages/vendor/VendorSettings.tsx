import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Save, AlertCircle, CheckCircle, Store, Upload, Image } from 'lucide-react';

export function VendorSettings() {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Shop Settings State
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [shopLogoUrl, setShopLogoUrl] = useState('');
    const [shopBannerUrl, setShopBannerUrl] = useState('');

    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchShopDetails();
    }, [user]);

    const fetchShopDetails = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('vendor_profiles')
            .select('shop_name, shop_description, shop_logo_url, shop_banner_url')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setShopName(data.shop_name || '');
            setShopDescription(data.shop_description || '');
            setShopLogoUrl(data.shop_logo_url || '');
            setShopBannerUrl(data.shop_banner_url || '');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        const isLogo = type === 'logo';
        if (isLogo) setUploadingLogo(true);
        else setUploadingBanner(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${type}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('shop-assets')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('shop-assets')
                .getPublicUrl(fileName);

            if (isLogo) setShopLogoUrl(publicUrl);
            else setShopBannerUrl(publicUrl);

            setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Banner'} uploaded. Remember to save changes.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            if (isLogo) setUploadingLogo(false);
            else setUploadingBanner(false);
        }
    };

    const handleUpdateShop = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('vendor_profiles')
                .update({
                    shop_name: shopName,
                    shop_description: shopDescription,
                    shop_logo_url: shopLogoUrl,
                    shop_banner_url: shopBannerUrl
                })
                .eq('user_id', user?.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Shop details updated successfully.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ email });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Confirmation link sent to your new email.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully.' });
            setPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manage your shop profile and account security.</p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Shop Settings */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                        <Store className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Shop Details</h3>
                </div>

                <form onSubmit={handleUpdateShop} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Shop Name</label>
                            <input
                                type="text"
                                required
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="My Awesome Shop"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                            <textarea
                                rows={3}
                                value={shopDescription}
                                onChange={(e) => setShopDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                                placeholder="Brief description of your shop..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 text-emerald-600 uppercase tracking-widest">Shop Logo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group hover:border-emerald-500 transition-colors relative">
                                    {shopLogoUrl ? (
                                        <img src={shopLogoUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Image className="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                    )}
                                    {uploadingLogo && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex-1">
                                    <div className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 hover:border-emerald-500 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-emerald-600 shadow-sm transition-all active:scale-95">
                                        <Upload className="w-4 h-4" />
                                        {uploadingLogo ? 'Uploading...' : 'Change Logo'}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'logo')}
                                        disabled={uploadingLogo}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5 text-emerald-600 uppercase tracking-widest">Shop Banner</label>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group hover:border-emerald-500 transition-colors relative">
                                    {shopBannerUrl ? (
                                        <img src={shopBannerUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Image className="w-6 h-6 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                    )}
                                    {uploadingBanner && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex-1">
                                    <div className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 hover:border-emerald-500 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-emerald-600 shadow-sm transition-all active:scale-95">
                                        <Upload className="w-4 h-4" />
                                        {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'banner')}
                                        disabled={uploadingBanner}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {loading ? 'Saving...' : 'Save Details'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Email Update */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Update Email</h3>
                    </div>

                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Email</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                placeholder="new@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {loading ? 'Updating...' : 'Update Email'}
                        </button>
                    </form>
                </div>

                {/* Password Update */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <Lock className="w-4 h-4 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm">Change Password</h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                placeholder="Min 6 chars"
                            />
                        </div>
                        <div className="pt-[52px]"> {/* Spacer to align buttons if needed, or just let it flow */}
                            <button
                                type="submit"
                                disabled={loading || !password}
                                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-3.5 h-3.5" />
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
