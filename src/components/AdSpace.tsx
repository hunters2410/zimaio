import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Megaphone, X } from 'lucide-react';

interface VendorAd {
    id: string;
    title: string;
    image_url: string;
    link_url: string;
    ad_type: 'banner' | 'sidebar' | 'popup' | 'featured';
}

interface AdSpaceProps {
    type: 'banner' | 'sidebar' | 'popup' | 'featured';
    limit?: number;
    className?: string;
}

export function AdSpace({ type, limit = 1, className = '' }: AdSpaceProps) {
    const [ads, setAds] = useState<VendorAd[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        fetchAds();
    }, [type]);

    const fetchAds = async () => {
        try {
            const { data, error } = await supabase
                .from('vendor_ads')
                .select('*')
                .eq('status', 'active')
                .eq('ad_type', type)
                .lte('start_date', new Date().toISOString())
                .gte('end_date', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!error && data) {
                setAds(data as VendorAd[]);

                // Record Impressions
                const adIds = data.map(ad => (ad as any).id);
                if (adIds.length > 0) {
                    supabase.rpc('increment_ad_impressions', { ad_ids: adIds }).then(({ error: rpcError }) => {
                        if (rpcError) console.error('Error recording impressions:', rpcError);
                    });
                }
            }
        } catch (err) {
            console.error(`Error fetching ${type} ads:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdClick = async (adId: string) => {
        try {
            const { error } = await supabase.rpc('increment_ad_clicks', { ad_id: adId });
            if (error) console.error('Error recording click:', error);
        } catch (e) {
            console.error('Error in handleAdClick:', e);
        }
    };

    if (loading || ads.length === 0 || !isVisible) return null;

    if (type === 'popup') {
        const ad = ads[0];
        const hasShown = sessionStorage.getItem(`shown_popup_${ad.id}`);
        if (hasShown) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative max-w-lg w-full bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 border border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            sessionStorage.setItem(`shown_popup_${ad.id}`, 'true');
                        }}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <a
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            handleAdClick(ad.id);
                            setIsVisible(false);
                            sessionStorage.setItem(`shown_popup_${ad.id}`, 'true');
                        }}
                        className="block group"
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                <span className="inline-block self-start px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full mb-4 shadow-lg">Special Offer</span>
                                <h3 className="text-3xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{ad.title}</h3>
                                <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-[10px]">
                                    Explore Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        );
    }

    if (type === 'sidebar') {
        return (
            <div className={`space-y-4 ${className}`}>
                {ads.map(ad => (
                    <a
                        key={ad.id}
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAdClick(ad.id)}
                        className="block bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 group overflow-hidden transition-all hover:shadow-md"
                    >
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden mb-3">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-lg text-white text-[8px] font-black uppercase tracking-widest border border-white/10">Sponsored</div>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 px-2 mb-1 uppercase tracking-tight">{ad.title}</h4>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black px-2 uppercase tracking-widest flex items-center gap-1">
                            Shop Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </p>
                    </a>
                ))}
            </div>
        );
    }

    if (type === 'featured') {
        return (
            <div className={`${className}`}>
                {ads.map(ad => (
                    <a
                        key={ad.id}
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAdClick(ad.id)}
                        className="block relative rounded-[2.5rem] overflow-hidden group shadow-2xl hover:shadow-emerald-900/20 transition-all duration-700 border border-gray-100 dark:border-slate-800"
                    >
                        <div className="aspect-[21/9] md:aspect-[25/7] relative">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center p-8 md:p-16">
                                <div className="max-w-xl text-white">
                                    <span className="inline-block px-4 py-1 rounded-full bg-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg border border-white/20 animate-pulse">Trending Now</span>
                                    <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight drop-shadow-lg uppercase tracking-tight">{ad.title}</h2>
                                    <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-xl active:scale-95 border border-transparent hover:border-white/20">Discover More</button>
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        );
    }

    if (type === 'banner') {
        return (
            <div className={`grid grid-cols-1 md:grid-cols-${ads.length > 1 ? '2' : '1'} gap-6 ${className}`}>
                {ads.map(ad => (
                    <a
                        key={ad.id}
                        href={ad.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAdClick(ad.id)}
                        className="block relative rounded-3xl overflow-hidden group border border-gray-100 dark:border-slate-800 shadow-xl transition-all hover:shadow-emerald-900/10"
                    >
                        <div className="aspect-[21/9] relative">
                            <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                <span className="inline-block self-start px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-white text-[8px] font-black uppercase tracking-widest mb-2 border border-white/10">Partner Ad</span>
                                <h3 className="text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-tight leading-none">{ad.title}</h3>
                                <div className="flex items-center gap-2 text-white/70 font-bold uppercase tracking-widest text-[9px] group-hover:text-white transition-colors">
                                    Check Collection <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        );
    }

    return null;
}
