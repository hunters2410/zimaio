import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { Megaphone, Check, X, Eye, MousePointer, Calendar, Clock, Trash2, ExternalLink } from 'lucide-react';

interface AdRequest {
    id: string;
    vendor_id: string;
    title: string;
    image_url: string;
    link_url: string;
    ad_type: string;
    status: 'pending' | 'active' | 'rejected' | 'expired' | 'banned';
    start_date: string;
    end_date: string;
    impressions: number;
    clicks: number;
    created_at: string;
    vendor_profiles: {
        shop_name: string;
    };
}

export default function AdsManagement() {
    const [ads, setAds] = useState<AdRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'banned'>('all');

    useEffect(() => {
        fetchAds();
    }, [filter]);

    const fetchAds = async () => {
        let query = supabase.from('vendor_ads').select('*, vendor_profiles(shop_name)').order('created_at', { ascending: false });

        if (filter === 'pending') {
            query = query.eq('status', 'pending');
        } else if (filter === 'active') {
            query = query.eq('status', 'active');
        } else if (filter === 'banned') {
            query = query.eq('status', 'banned');
        }

        const { data, error } = await query;
        if (!error && data) setAds(data as any[]);
        setLoading(false);
    };

    const handleStatus = async (id: string, status: 'active' | 'rejected' | 'banned') => {
        const { error } = await supabase.from('vendor_ads').update({ status }).eq('id', id);
        if (!error) fetchAds();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this ad?')) return;
        const { error } = await supabase.from('vendor_ads').delete().eq('id', id);
        if (!error) fetchAds();
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                            <Megaphone className="w-6 h-6 mr-2 text-purple-600" />
                            Ads Management
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">Review and approve vendor advertisement campaigns</p>
                    </div>
                </div>

                <div className="flex space-x-2">
                    {['all', 'pending', 'active', 'banned'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded font-medium uppercase text-xs transition ${filter === f ? 'bg-purple-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                    ) : ads.map((ad) => (
                        <div key={ad.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition">
                            <div className="md:w-48 h-32 md:h-auto relative overflow-hidden">
                                <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.status === 'active' ? 'bg-green-500 text-white' : ad.status === 'pending' ? 'bg-amber-500 text-white' : ad.status === 'rejected' ? 'bg-red-500 text-white' : ad.status === 'banned' ? 'bg-black text-white' : 'bg-gray-500 text-white'}`}>
                                        {ad.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 p-4 flex flex-col">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{ad.title}</h3>
                                        <p className="text-gray-500 text-xs mt-1">
                                            Type: {ad.ad_type} • Shop: <span className="text-purple-600">{ad.vendor_profiles?.shop_name}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {ad.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleStatus(ad.id, 'active')} title="Approve" className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-600 hover:text-white transition">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleStatus(ad.id, 'rejected')} title="Reject" className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        {ad.status === 'active' && (
                                            <button onClick={() => handleStatus(ad.id, 'banned')} title="Ban" className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition">
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                        {ad.status === 'banned' && (
                                            <button onClick={() => handleStatus(ad.id, 'active')} title="Reactivate" className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-600 hover:text-white transition">
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(ad.id)} className="p-2 bg-gray-100 text-gray-400 rounded hover:bg-gray-900 hover:text-white transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-auto">
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                            <Eye className="w-3 h-3" /> Views
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">{ad.impressions.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-200">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                            <MousePointer className="w-3 h-3" /> Clicks
                                        </div>
                                        <div className="text-lg font-bold text-gray-900">{ad.clicks.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-200 col-span-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                                            <Calendar className="w-3 h-3" /> Schedule
                                        </div>
                                        <div className="text-xs font-medium text-gray-900">
                                            {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                    <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
                                        <ExternalLink className="w-3 h-3" /> {ad.link_url}
                                    </a>
                                    {ad.status === 'active' && (
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                            Live Campaign
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {ads.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-gray-400">No campaigns found</h3>
                            <p className="text-sm text-gray-300">Wait for vendors to submit requests</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
