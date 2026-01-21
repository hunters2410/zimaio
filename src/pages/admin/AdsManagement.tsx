import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import {
    Megaphone,
    Check,
    X,
    Eye,
    MousePointer,
    Calendar,
    Clock,
    Trash2,
    ExternalLink
} from 'lucide-react';

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
        let query = supabase
            .from('vendor_ads')
            .select('*, vendor_profiles(shop_name)')
            .order('created_at', { ascending: false });

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
        const { error } = await supabase
            .from('vendor_ads')
            .update({ status })
            .eq('id', id);

        if (!error) fetchAds();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;
        const { error } = await supabase.from('vendor_ads').delete().eq('id', id);
        if (!error) fetchAds();
    };

    return (
        <AdminLayout>
            <div className="mb-10">
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-purple-600 rounded-lg shadow-lg">
                        <Megaphone className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        Ads Management
                    </h1>
                </div>
                <p className="text-gray-500 text-lg">Review and approve vendor advertisement campaigns.</p>
            </div>

            <div className="flex space-x-2 mb-8">
                {['all', 'pending', 'active', 'banned'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${filter === f
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <div className="flex justify-center py-24">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : ads.map((ad) => (
                    <div key={ad.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-xl transition-all duration-300">
                        <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-4 left-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border ${ad.status === 'active' ? 'bg-green-500 text-white border-green-600' :
                                    ad.status === 'pending' ? 'bg-amber-500 text-white border-amber-600' :
                                        ad.status === 'rejected' ? 'bg-red-500 text-white border-red-600' :
                                            ad.status === 'banned' ? 'bg-black text-white border-gray-900' :
                                                'bg-gray-500 text-white border-gray-600'
                                    }`}>
                                    {ad.status}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 p-8 flex flex-col">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Requested on {new Date(ad.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{ad.title}</h3>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                                        Type: {ad.ad_type} • Shop: <span className="text-purple-600 underline cursor-pointer">{ad.vendor_profiles?.shop_name}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ad.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatus(ad.id, 'active')} title="Approve" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"><Check className="w-5 h-5" /></button>
                                            <button onClick={() => handleStatus(ad.id, 'rejected')} title="Reject" className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><X className="w-5 h-5" /></button>
                                        </>
                                    )}
                                    {ad.status === 'active' && (
                                        <button onClick={() => handleStatus(ad.id, 'banned')} title="Ban" className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><X className="w-5 h-5" /></button>
                                    )}
                                    {ad.status === 'banned' && (
                                        <button onClick={() => handleStatus(ad.id, 'active')} title="Reactivate" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"><Check className="w-5 h-5" /></button>
                                    )}
                                    <button onClick={() => handleDelete(ad.id)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all shadow-sm"><Trash2 className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-auto">
                                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1"><Eye className="w-3 h-3" /> Views</div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{ad.impressions.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1"><MousePointer className="w-3 h-3" /> Clicks</div>
                                    <div className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{ad.clicks.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl col-span-2">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1"><Calendar className="w-3 h-3" /> Schedule</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                                <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline hover:text-purple-700">
                                    <ExternalLink className="w-3 h-3" /> {ad.link_url}
                                </a>
                                {ad.status === 'active' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Live Campaign</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {ads.length === 0 && (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
                        <Megaphone className="h-16 w-16 text-gray-200 dark:text-slate-800 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 uppercase tracking-tight">No campaigns found</h3>
                        <p className="text-sm text-gray-300">Wait for vendors to submit requests.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
