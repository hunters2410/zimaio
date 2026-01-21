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
    AlertCircle
} from 'lucide-react';

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
            // 1. Check Access via Vendor Profile -> Package
            const { data: vendor, error: vendorError } = await supabase
                .from('vendor_profiles')
                .select(`
          *,
          vendor_subscriptions (
            vendor_packages (has_ads_access)
          )
        `)
                .eq('user_id', profile?.id)
                .single();

            if (vendorError) throw vendorError;

            // Access Check: Either direct legacy check or via subscription relation
            const canAccess = vendor.vendor_subscriptions?.vendor_packages?.has_ads_access || false;
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
        const { data, error } = await supabase
            .from('vendor_ads')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setAds(data as VendorAd[]);
        }
    };

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

    if (loading) return <div className="p-8 text-center text-gray-500">Loading ads module...</div>;

    if (!hasAccess) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12 px-4">
                <div className="bg-gradient-to-br from-purple-100 to-indigo-50 p-8 rounded-3xl border border-purple-100 shadow-xl">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Megaphone className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Boost Your Sales with Ads!</h2>
                    <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                        Unlock the power of targeted advertising. Create banners, popups, and featured listings to reach more customers.
                        This feature is exclusively available for <span className="font-bold text-purple-600">Premium & Gold</span> partners.
                    </p>
                    <button
                        onClick={() => onTabChange?.('packages')}
                        className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-200 active:scale-95"
                    >
                        Upgrade My Package
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Ads Management</h2>
                    <p className="text-sm text-gray-500">Manage your promotional campaigns</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Campaign
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {ads.map((ad) => (
                    <div key={ad.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden group">
                        <div className="aspect-video bg-gray-100 relative">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border shadow-sm ${ad.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                                    ad.status === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                    {ad.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                                    <p className="text-xs text-gray-500 uppercase font-medium">{ad.ad_type}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingAd(ad); setFormData(ad as any); setShowModal(true); }} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-blue-600 transition"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(ad.id)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                        <Eye className="w-3 h-3" /> Views
                                    </div>
                                    <div className="text-lg font-black text-gray-900">{ad.impressions.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-1">
                                        <MousePointer className="w-3 h-3" /> Clicks
                                    </div>
                                    <div className="text-lg font-black text-gray-900">{ad.clicks.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {ads.length === 0 && (
                    <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400">
                        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No active campaigns</p>
                        <p className="text-sm">Start promoting your products today</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900">{editingAd ? 'Edit Campaign' : 'New Campaign'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-6 h-6 text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Campaign Title</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Summer Sale 2024" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Ad Type</label>
                                    <select value={formData.ad_type} onChange={e => setFormData({ ...formData, ad_type: e.target.value as any })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none">
                                        <option value="banner">Main Banner</option>
                                        <option value="sidebar">Sidebar Ad</option>
                                        <option value="popup">Popup Modal</option>
                                        <option value="featured">Featured Spot</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Target URL</label>
                                    <input type="text" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Image URL</label>
                                <div className="flex gap-2">
                                    <input required type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://..." />
                                    <button type="button" className="px-4 bg-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-200"><ImageIcon className="w-5 h-5" /></button>
                                </div>
                                {formData.image_url && <img src={formData.image_url} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-xl border border-gray-200" />}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                                    <input required type="datetime-local" value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, start_date: new Date(e.target.value).toISOString() })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                                    <input required type="datetime-local" value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''} onChange={e => setFormData({ ...formData, end_date: new Date(e.target.value).toISOString() })} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 active:scale-95 disabled:opacity-50">
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
