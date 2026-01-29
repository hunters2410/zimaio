import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Store, Star, ArrowRight, MapPin, ShieldCheck, Search } from 'lucide-react';

interface VendorShop {
    id: string;
    user_id: string;
    shop_name: string;
    shop_description: string;
    shop_logo_url: string;
    shop_banner_url: string;
    is_verified: boolean;
    rating: number;
}

export function VendorsPage() {
    const [vendors, setVendors] = useState<VendorShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vendor_profiles')
            .select('*')
            .order('shop_name');

        if (data) setVendors(data);
        setLoading(false);
    };

    const filteredVendors = vendors.filter(v =>
        v.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.shop_description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            {/* Hero Header */}
            <div className="bg-gray-900 dark:bg-slate-950 text-white py-20 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 uppercase tracking-tight">Our Verified Vendors</h1>
                    <p className="text-gray-400 dark:text-gray-500 max-w-2xl mx-auto font-medium uppercase tracking-wide leading-relaxed">
                        Discover premium shops and professional sellers curated for excellence and reliability.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-8">
                {/* Search & Filter Bar */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-900/50 p-4 border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by shop name or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-slate-700 dark:text-gray-200 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-600 focus:border-emerald-500 outline-none transition-all font-bold text-sm uppercase tracking-tight placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-gray-100 dark:bg-slate-800 rounded-[2rem] h-80 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 text-left">
                        {filteredVendors.length > 0 ? (
                            filteredVendors.map((vendor) => (
                                <Link
                                    key={vendor.id}
                                    to={`/shop/${vendor.user_id}`}
                                    className="group bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                                >
                                    <div className="h-32 bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                                        {vendor.shop_banner_url ? (
                                            <img src={vendor.shop_banner_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={vendor.shop_name} />
                                        ) : (
                                            <div className="w-full h-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                                <Store className="w-12 h-12 text-emerald-200 dark:text-emerald-800" />
                                            </div>
                                        )}
                                        {vendor.is_verified && (
                                            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 pt-0 relative flex-grow flex flex-col">
                                        <div className="flex items-start gap-3">
                                            <div className="w-16 h-16 bg-white dark:bg-slate-700 p-1 rounded-2xl shadow-xl -mt-8 relative z-10 border border-gray-50 dark:border-slate-600 flex items-center justify-center overflow-hidden transition-transform group-hover:rotate-3">
                                                {vendor.shop_logo_url ? (
                                                    <img src={vendor.shop_logo_url} className="w-full h-full object-cover rounded-xl" alt="" />
                                                ) : (
                                                    <Store className="w-8 h-8 text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="mt-3 flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight truncate">{vendor.shop_name}</h3>
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-1 py-0.5 rounded-lg">
                                                        <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-[9px] font-black text-yellow-700 dark:text-yellow-400 ml-0.5">{(vendor.rating || 5.0).toFixed(1)}</span>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">• Verified</span>
                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-tight">• Verified</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-gray-500 dark:text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed tracking-tight flex-grow opacity-80 group-hover:opacity-100">
                                            {vendor.shop_description || "Premium marketplace vendor offering quality goods and exceptional service."}
                                        </p>
                                        <div className="mt-5 pt-4 border-t border-gray-50 dark:border-slate-700 flex items-center justify-between">
                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                <MapPin className="w-2.5 h-2.5" /> Zimbabwe
                                            </span>
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest group-hover:gap-3 transition-all">
                                                Enter Store <ArrowRight className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <Store className="w-20 h-20 text-gray-200 dark:text-slate-700 mx-auto mb-6" />
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">No Vendors Found</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Try broadening your search or check back later.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
