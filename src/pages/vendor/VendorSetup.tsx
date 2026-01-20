import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Store, Upload, ArrowRight, AlertCircle, ChevronDown, Check, Search } from 'lucide-react';

export function VendorSetup() {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Package Selection State
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchPackages = async () => {
            const { data } = await supabase
                .from('vendor_packages')
                .select('*')
                .eq('is_active', true)
                .order('sort_order');

            if (data) {
                setPackages(data);
                // Default to 'Starter' or first available, or one marked is_default
                const defaultPkg = data.find(p => p.is_default) || data[0];
                setSelectedPackage(defaultPkg);
            }
        };
        fetchPackages();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!selectedPackage) {
            setError("Please select a subscription package.");
            setLoading(false);
            return;
        }

        const formData = new FormData(e.currentTarget);
        const shopName = formData.get('shopName') as string;
        const shopDescription = formData.get('shopDescription') as string;
        const businessEmail = formData.get('businessEmail') as string;
        const businessPhone = formData.get('businessPhone') as string;

        try {
            // 1. Create/Update Vendor Profile
            const { error: insertError } = await supabase
                .from('vendor_profiles')
                .upsert({
                    user_id: profile?.id,
                    shop_name: shopName,
                    shop_description: shopDescription,
                    business_email: businessEmail,
                    business_phone: businessPhone,
                    is_approved: false,
                    kyc_status: 'none'
                }, { onConflict: 'user_id' });

            if (insertError) throw insertError;

            // 2. Create Subscription with Selected Package
            const { data: existingSub } = await supabase
                .from('vendor_subscriptions')
                .select('id')
                .eq('vendor_id', profile?.id)
                .maybeSingle();

            if (!existingSub) {
                await supabase
                    .from('vendor_subscriptions')
                    .insert({
                        vendor_id: profile?.id,
                        package_id: selectedPackage.id,
                        status: 'active',
                        billing_cycle: 'monthly'
                    });
            } else {
                // Optionally update existing subscription if they are re-running setup? 
                // Typically setup is run once. If it exists, we might ignore updates or update it.
                // For now, let's update it to ensure they get the selected package.
                await supabase
                    .from('vendor_subscriptions')
                    .update({
                        package_id: selectedPackage.id,
                        billing_cycle: 'monthly'
                    })
                    .eq('id', existingSub.id);
            }

            navigate('/vendor/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500 relative">
                <div className="p-10 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-6 rounded-t-[40px]">
                    <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Store size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Shop Setup</h1>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">Configure your digital storefront identity.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle size={20} />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Shop Name</label>
                                <input
                                    name="shopName"
                                    required
                                    placeholder="e.g. Zim Minerals Premium"
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 px-5 text-sm font-black transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Business Email</label>
                                <input
                                    name="businessEmail"
                                    type="email"
                                    required
                                    defaultValue={profile?.email}
                                    placeholder="sales@yourshop.com"
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 px-5 text-sm font-black transition-all outline-none dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Business Phone</label>
                                <input
                                    name="businessPhone"
                                    required
                                    placeholder="+263 ..."
                                    className="w-full bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 px-5 text-sm font-black transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Shop Logo (Optional)</label>
                                <div className="w-full h-[54px] bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border border-dashed rounded-2xl flex items-center justify-center text-gray-400 text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                    <Upload size={14} />
                                    Select File
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Shop Description</label>
                        <textarea
                            name="shopDescription"
                            required
                            rows={3}
                            placeholder="Tell customers about your products and expertise..."
                            className="w-full bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border focus:border-emerald-500 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl p-5 text-sm font-bold transition-all outline-none dark:text-white"
                        />
                    </div>

                    {/* Package Selection Dropdown */}
                    <div className="relative group z-20">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Select Subscription Plan</label>

                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700 border rounded-2xl p-4 cursor-pointer flex items-center justify-between hover:border-emerald-500 transition-all"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-gray-900 dark:text-white">{selectedPackage?.name || 'Select Package'}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedPackage?.price_monthly === 0 ? 'text-emerald-500' : 'text-gray-500'}`}>
                                    {selectedPackage?.price_monthly === 0 ? 'Lifetime Free Access' : `$${selectedPackage?.price_monthly}/mo`}
                                </span>
                            </div>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden z-50">
                                <div className="p-3 border-b border-gray-50 dark:border-slate-700">
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                                        <Search size={14} className="text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search packages..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none outline-none text-xs font-bold w-full dark:text-white"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
                                    {packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(pkg => (
                                        <div
                                            key={pkg.id}
                                            onClick={() => {
                                                setSelectedPackage(pkg);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${selectedPackage?.id === pkg.id ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
                                        >
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wide">{pkg.name}</p>
                                                <p className="text-[10px] opacity-70">
                                                    {pkg.price_monthly === 0 ? 'Free' : `$${pkg.price_monthly} / mo`}
                                                </p>
                                            </div>
                                            {selectedPackage?.id === pkg.id && <Check size={14} />}
                                        </div>
                                    ))}
                                    {packages.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                        <div className="p-4 text-center text-xs text-gray-400 font-medium">No packages found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 dark:bg-emerald-600 text-white py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-xl shadow-gray-200 dark:shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Propagating Store Data...' : (
                                <>
                                    Launch My Store
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
