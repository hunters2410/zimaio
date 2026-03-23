import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    Megaphone,
    Plus,
    Image as ImageIcon,
    Eye,
    MousePointer,
    Calendar,
    Trash2,
    Edit2,
    Check,
    X,
    AlertCircle,
    Filter
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';

interface VendorAd {
    id: string;
    title: string;
    image_url: string;
    link_url: string;
    ad_type: 'banner' | 'sidebar' | 'popup' | 'featured';
    status: 'pending' | 'active' | 'rejected' | 'expired';
    start_date: string;
    end_date: string;
    impressions: number;
    clicks: number;
}

export function VendorAdsManagement({ onTabChange }: { onTabChange?: (tab: string) => void }) {
    const { profile } = useAuth();
    const [ads, setAds] = useState<VendorAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<VendorAd | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 6;
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        ad_type: 'banner' as const,
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (profile) {
            checkAccessAndFetch();
        }
    }, [profile]);

    const checkAccessAndFetch = async () => {
        try {
            // 1. Get Vendor Profile
            const { data: vendor, error: vendorError } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', profile?.id)
                .single();

            if (vendorError) throw vendorError;

            // 2. Get Subscription & Package Features separately to avoid relationship errors
            const { data: subscription } = await supabase
                .from('vendor_subscriptions')
                .select(`
                    status,
                    vendor_packages (has_ads_access)
                `)
                .eq('vendor_id', profile?.id)
                .maybeSingle();

            // Access Check: Check package features
            const pkg = subscription?.vendor_packages;
            const canAccess = Array.isArray(pkg)
                ? pkg[0]?.has_ads_access
                : (pkg as any)?.has_ads_access || false;

            setHasAccess(canAccess);

            if (canAccess) {
                fetchAds(vendor.id);
            }
        } catch (error) {
            console.error('Error checking ads access:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAds = async (vendorId: string) => {
        const { data, error, count } = await supabase
            .from('vendor_ads')
            .select('*', { count: 'exact' })
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        if (!error && data) {
            setAds(data as VendorAd[]);
            setTotalItems(count || 0);
        }
    };

    // Add useEffect to refetch ads on page change
    useEffect(() => {
        if (profile) {
            const checkAndFetch = async () => {
                const { data: vendor } = await supabase
                    .from('vendor_profiles')
                    .select('id')
                    .eq('user_id', profile.id)
                    .single();
                if (vendor) fetchAds(vendor.id);
            };
            checkAndFetch();
        }
    }, [currentPage]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const vendorId = (await supabase.from('vendor_profiles').select('id').eq('user_id', profile?.id).single()).data?.id;

            if (!vendorId) throw new Error('Vendor not found');

            const adData = {
                vendor_id: vendorId,
                title: formData.title,
                image_url: formData.image_url,
                link_url: formData.link_url,
                ad_type: formData.ad_type,
                start_date: formData.start_date,
                end_date: formData.end_date,
                status: 'active' // Automatically approved as per new requirement
            };

            if (editingAd) {
                const { error } = await supabase
                    .from('vendor_ads')
                    .update(adData)
                    .eq('id', editingAd.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Ad updated successfully' });
            } else {
                const { error } = await supabase
                    .from('vendor_ads')
                    .insert(adData);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Ad created successfully' });
            }

            setShowModal(false);
            fetchAds(vendorId);
            resetForm();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        try {
            const { error } = await supabase.from('vendor_ads').delete().eq('id', id);
            if (error) throw error;
            const vendorId = (await supabase.from('vendor_profiles').select('id').eq('user_id', profile?.id).single()).data?.id;
            if (vendorId) fetchAds(vendorId);
            setMessage({ type: 'success', text: 'Ad deleted successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const resetForm = () => {
        setEditingAd(null);
        setFormData({
            title: '',
            image_url: '',
            link_url: '',
            ad_type: 'banner',
            start_date: '',
            end_date: ''
        });
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading ads module...</p>
        </div>
    );

    if (!hasAccess) {
        return (
            <div className="max-w-3xl mx-auto py-12 px-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-900/20 dark:to-indigo-900/20 p-8 md:p-12 rounded-[32px] border border-purple-100 dark:border-purple-800/30 shadow-2xl shadow-purple-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Megaphone className="w-48 h-48 text-purple-600 rotate-12" />
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/10 border border-purple-50 dark:border-purple-900/30">
                            <Megaphone className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">Boost Your Sales with Ads!</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg leading-relaxed max-w-xl mx-auto font-medium">
                            Unlock the power of targeted advertising. Create banners, popups, and featured listings to reach more customers.
                            This feature is exclusively available for <span className="text-purple-600 dark:text-purple-400 font-black">Premium & Gold</span> partners.
                        </p>
                        <button
                            onClick={() => onTabChange?.('packages')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-500/20 active:scale-95 group"
                        >
                            Upgrade My Package
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ads Management</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage your promotional campaigns and track performance.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Create Campaign
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${message.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800'
                    }`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm uppercase tracking-tight">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ads.map((ad) => (
                    <div key={ad.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all overflow-hidden group">
                        <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm backdrop-blur-md ${ad.status === 'active'
                                    ? 'bg-emerald-50/90 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50' :
                                    ad.status === 'pending'
                                        ? 'bg-amber-50/90 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50' :
                                        'bg-slate-100/90 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50'
                                    }`}>
                                    {ad.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white line-clamp-1 uppercase tracking-tight">{ad.title}</h3>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest mt-0.5">{ad.ad_type}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingAd(ad); setFormData(ad as any); setShowModal(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDelete(ad.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">
                                        <Eye className="w-3 h-3" /> Views
                                    </div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{ad.impressions.toLocaleString()}</div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent dark:border-slate-800">
                                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">
                                        <MousePointer className="w-3 h-3" /> Clicks
                                    </div>
                                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{ad.clicks.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {ads.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] p-16 text-center group hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
                            <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No active campaigns</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">Start promoting your products today to reach more buyers</p>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-center">
                <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingAd ? 'Edit Campaign' : 'New Campaign'}</h3>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Configure your promotional campaign</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                                <X className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                            <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Campaign Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[14px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Summer Sale 2024"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Ad Type</label>
                                        <select
                                            value={formData.ad_type}
                                            onChange={e => setFormData({ ...formData, ad_type: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="banner">Home/Products Banner (Inline)</option>
                                            <option value="sidebar">Products Sidebar Spot</option>
                                            <option value="popup">Entry Popup (Global)</option>
                                            <option value="featured">Home Page Hero Spot</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Target URL</label>
                                        <input
                                            type="text"
                                            value={formData.link_url}
                                            onChange={e => setFormData({ ...formData, link_url: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Image URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            required
                                            type="text"
                                            value={formData.image_url}
                                            onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="https://..."
                                        />
                                        <button type="button" className="px-4 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                                    </div>
                                    {formData.image_url && <img src={formData.image_url} alt="Preview" className="mt-3 aspect-video w-full object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm" />}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Start Date</label>
                                        <input required type="datetime-local" value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">End Date</label>
                                        <input required type="datetime-local" value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[9px] border border-slate-200 dark:border-slate-700 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] bg-purple-600 text-white font-black py-3 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[10px]"
                                >
                                    {loading ? 'Saving...' : 'Save Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
