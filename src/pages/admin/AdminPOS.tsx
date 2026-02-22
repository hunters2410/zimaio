import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { VendorPOS } from '../vendor/VendorPOS';
import { AdminLayout } from '../../components/AdminLayout';
import { Store, Search, ChevronRight, AlertCircle } from 'lucide-react';

export function AdminPOS() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const { data, error } = await supabase
                .from('vendor_profiles')
                .select('id, shop_name, shop_logo_url, rating')
                .order('shop_name');

            if (error) throw error;
            setVendors(data || []);
        } catch (err) {
            console.error('Error fetching vendors for POS:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <AdminLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
        </AdminLayout>
    );

    if (!selectedVendorId) {
        return (
            <AdminLayout>
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Admin Terminal POS</h2>
                            <p className="text-xs text-gray-500 mt-1">Select a vendor shop to initiate a point of sale session.</p>
                        </div>
                    </div>

                    <div className="relative group max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search vendor shops..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-gray-100 border focus:border-cyan-500 rounded-[24px] py-5 pl-14 pr-6 text-sm font-bold transition-all outline-none shadow-xl shadow-gray-100/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVendors.map(vendor => (
                            <button
                                key={vendor.id}
                                onClick={() => setSelectedVendorId(vendor.id)}
                                className="group bg-white rounded-[32px] p-6 border border-gray-100 hover:border-cyan-200 transition-all shadow-sm hover:shadow-xl hover:shadow-cyan-100/50 flex items-center gap-6 text-left active:scale-95"
                            >
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-gray-100 group-hover:bg-cyan-50 transition-colors">
                                    {vendor.shop_logo_url ? (
                                        <img src={vendor.shop_logo_url} alt={vendor.shop_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="text-gray-300 group-hover:text-cyan-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight truncate">{vendor.shop_name}</h3>
                                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">ID: {vendor.id.slice(0, 8).toUpperCase()}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[9px] font-black uppercase text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-100">
                                            Rating: {vendor.rating || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                        {filteredVendors.length === 0 && (
                            <div className="col-span-full py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                                <p className="text-sm font-bold text-gray-400">No active vendors found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 bg-gray-900 p-6 rounded-[32px] text-white shadow-xl">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSelectedVendorId(null)}
                            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
                        >
                            <ChevronRight className="rotate-180" />
                        </button>
                        <div className="h-10 w-px bg-white/10" />
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-tight">POS Terminal</h2>
                            <p className="text-[10px] font-bold text-white/40">Serving: {vendors.find(v => v.id === selectedVendorId)?.shop_name}</p>
                        </div>
                    </div>
                    <div className="bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-cyan-500/20">
                        Admin Override Active
                    </div>
                </div>

                <VendorPOS overrideVendorId={selectedVendorId} />
            </div>
        </AdminLayout>
    );
}
