import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, Save, AlertCircle, CheckCircle, Store, Upload, Image, DollarSign, X, FileText, ShieldCheck, ArrowRight } from 'lucide-react';

export function VendorSettings() {
    const { user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Shop Settings State
    const [shopName, setShopName] = useState('');
    const [shopDescription, setShopDescription] = useState('');
    const [shopLogoUrl, setShopLogoUrl] = useState('');
    const [shopBannerUrl, setShopBannerUrl] = useState('');
    const [currencyCode, setCurrencyCode] = useState('USD');

    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const openContractModal = async (type: 'vendor_terms' | 'vendor_privacy', title: string) => {
        setModalTitle(title);
        setShowModal(true);
        setModalLoading(true);
        setModalContent('');

        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('content')
                .eq('contract_type', type)
                .eq('is_active', true)
                .single();

            if (error) throw error;
            setModalContent(data.content);
        } catch (error: any) {
            setModalContent('Failed to load contract content. Please try again later.');
        } finally {
            setModalLoading(false);
        }
    };

    useEffect(() => {
        fetchShopDetails();
    }, [user]);

    const fetchShopDetails = async () => {
        if (!user) return;

        // Fetch vendor profile
        const { data: vendorData } = await supabase
            .from('vendor_profiles')
            .select('shop_name, shop_description, shop_logo_url, shop_banner_url')
            .eq('user_id', user.id)
            .single();

        if (vendorData) {
            setShopName(vendorData.shop_name || '');
            setShopDescription(vendorData.shop_description || '');
            setShopLogoUrl(vendorData.shop_logo_url || '');
            setShopBannerUrl(vendorData.shop_banner_url || '');
        }

        // Fetch profile currency
        const { data: profileData } = await supabase
            .from('profiles')
            .select('currency_code')
            .eq('id', user.id)
            .single();

        if (profileData) {
            setCurrencyCode(profileData.currency_code || 'USD');
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
            // Update vendor profile
            const { error: vendorError } = await supabase
                .from('vendor_profiles')
                .update({
                    shop_name: shopName,
                    shop_description: shopDescription,
                    shop_logo_url: shopLogoUrl,
                    shop_banner_url: shopBannerUrl
                })
                .eq('user_id', user?.id);

            if (vendorError) throw vendorError;

            // Update user profile currency
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ currency_code: currencyCode })
                .eq('id', user?.id);

            if (profileError) throw profileError;

            setMessage({ type: 'success', text: 'Financial and shop settings updated successfully.' });
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
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Settings</h2>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage your shop profile and account security.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-[20px] border flex items-center gap-3 animate-in zoom-in duration-300 ${message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                    <span className="text-[11px] font-black uppercase tracking-tight leading-none">{message.text}</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800/50 group-hover:rotate-6 transition-transform">
                        <Store className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Shop Details</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Configure your brand identity</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateShop} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Shop Name</label>
                            <input
                                type="text"
                                required
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="My Awesome Shop"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                rows={4}
                                value={shopDescription}
                                onChange={(e) => setShopDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="Brief description of your shop..."
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] ml-1">Shop Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden group/img hover:border-emerald-500 transition-all relative shadow-inner">
                                    {shopLogoUrl ? (
                                        <img src={shopLogoUrl} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <Image className="w-8 h-8 text-slate-300 dark:text-slate-700 group-hover/img:text-emerald-500 transition-colors" />
                                    )}
                                    {uploadingLogo && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center backdrop-blur-sm">
                                            <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex-1">
                                    <div className="flex items-center justify-center gap-3 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all active:scale-95 group/btn">
                                        <Upload className="w-4 h-4 group-hover/btn:translate-y-[-2px] transition-transform" />
                                        {uploadingLogo ? 'Propagating...' : 'Change Logo'}
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
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] ml-1">Shop Banner</label>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden group/img hover:border-emerald-500 transition-all relative shadow-inner">
                                    {shopBannerUrl ? (
                                        <img src={shopBannerUrl} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <Image className="w-8 h-8 text-slate-300 dark:text-slate-700 group-hover/img:text-emerald-500 transition-colors" />
                                    )}
                                    {uploadingBanner && (
                                        <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center backdrop-blur-sm">
                                            <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <label className="flex-1">
                                    <div className="flex items-center justify-center gap-3 cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all active:scale-95 group/btn">
                                        <Upload className="w-4 h-4 group-hover/btn:translate-y-[-2px] transition-transform" />
                                        {uploadingBanner ? 'Propagating...' : 'Change Banner'}
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

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <button
                            type="submit"
                            disabled={loading || uploadingLogo || uploadingBanner}
                            className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] px-10 py-4 rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/save"
                        >
                            <div className="flex items-center gap-3">
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                {loading ? 'Commiting Changes...' : 'Save Settings'}
                            </div>
                        </button>
                    </div>
                </form>
            </div>

            {/* Financial Settings */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-2xl text-cyan-600 dark:text-cyan-400 border border-cyan-100/50 dark:border-cyan-800/50 group-hover:rotate-6 transition-transform">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Financial Settings</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Configure your payout preferences</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-4">Withdrawal & Payout Currency</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setCurrencyCode('USD')}
                                className={`px-6 py-6 rounded-[24px] border-2 transition-all flex items-center justify-between group/curr ${currencyCode === 'USD'
                                    ? 'border-cyan-500 bg-cyan-50/30 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 shadow-lg shadow-cyan-500/10'
                                    : 'border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className="font-black uppercase text-xs tracking-widest leading-none">United States Dollar</p>
                                    <p className="font-bold text-[9px] uppercase tracking-widest opacity-60 mt-2">International Standard (USD)</p>
                                </div>
                                {currencyCode === 'USD' ? (
                                    <CheckCircle size={20} className="shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-800 shrink-0" />
                                )}
                            </button>
                            <button
                                onClick={() => setCurrencyCode('ZIG')}
                                className={`px-6 py-6 rounded-[24px] border-2 transition-all flex items-center justify-between group/curr ${currencyCode === 'ZIG'
                                    ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/10'
                                    : 'border-slate-50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                            >
                                <div className="text-left">
                                    <p className="font-black uppercase text-xs tracking-widest leading-none">Zimbabwe Gold</p>
                                    <p className="font-bold text-[9px] uppercase tracking-widest opacity-60 mt-2">Local Stable (ZIG)</p>
                                </div>
                                {currencyCode === 'ZIG' ? (
                                    <CheckCircle size={20} className="shrink-0" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-800 shrink-0" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Email Update */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50 group-hover:rotate-6 transition-transform">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Update Email</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Primary communications</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateEmail} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Current Email</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="new@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {loading ? 'Propagating...' : 'Update Email'}
                        </button>
                    </form>
                </div>

                {/* Password Update */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-2xl text-purple-600 dark:text-purple-400 border border-purple-100/50 dark:border-purple-800/50 group-hover:rotate-6 transition-transform">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Change Password</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Account protection</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                placeholder="Min 6 chars"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black uppercase tracking-[0.2em] py-4 rounded-xl transition-all shadow-xl shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {loading ? 'Securing...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-slate-50 dark:bg-slate-800/10 p-3 rounded-2xl text-slate-600 dark:text-slate-400 border border-slate-100/50 dark:border-slate-800/50 group-hover:rotate-6 transition-transform">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Legal & Compliance</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Regulatory Frameworks</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <button
                        onClick={() => openContractModal('vendor_terms', 'Vendor Terms & Conditions')}
                        className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 group/link hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                        <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white group-hover/link:text-emerald-700 dark:group-hover/link:text-emerald-400 transition-colors">Vendor Terms & Conditions</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Agreement for Platform Sellers</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 group-hover/link:text-emerald-600 group-hover/link:border-emerald-100 transition-all shadow-sm">
                            <FileText className="w-4 h-4" />
                        </div>
                    </button>

                    <button
                        onClick={() => openContractModal('vendor_privacy', 'Vendor Privacy Policy')}
                        className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 group/link hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-left shadow-sm hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                        <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 dark:text-white group-hover/link:text-emerald-700 dark:group-hover/link:text-emerald-400 transition-colors">Vendor Privacy Policy</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Data Protection Standards</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-400 group-hover/link:text-emerald-600 group-hover/link:border-emerald-100 transition-all shadow-sm">
                            <FileText className="w-4 h-4" />
                        </div>
                    </button>
                </div>
                <div className="mt-8 p-5 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/30">
                    <div className="flex items-start gap-4">
                        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-amber-900/70 dark:text-amber-400/70 uppercase tracking-widest leading-relaxed">
                            By using the ZimAIO Vendor Portal, you acknowledge that you have read and agreed to the legal frameworks above.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contract Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                            <div className="flex items-center gap-5">
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 shadow-inner">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tighter leading-none">{modalTitle}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 leading-none">Security • Verified Protocol • Compliance</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-400 dark:text-slate-600 transition-all hover:rotate-90"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/50">
                            {modalLoading ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-6">
                                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] animate-pulse">Decrypting content...</p>
                                </div>
                            ) : (
                                <div className="prose prose-slate dark:prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed font-bold text-sm">
                                        {modalContent}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-white dark:bg-slate-900">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-slate-900/20 dark:shadow-none"
                            >
                                Close Document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
