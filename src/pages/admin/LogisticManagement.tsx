import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Search,
    Truck,
    X,
    AlertCircle,
    ShieldCheck,
    ShieldAlert,
    Zap,
    CheckCircle2,
    Mail,
    Phone,
    Calendar,
    Building2,
    Edit,
    Eye,
    Plus
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface LogisticsPartner {
    id: string;
    user_id: string;
    company_name: string;
    description: string | null;
    business_email: string;
    business_phone: string | null;
    is_verified: boolean;
    is_active: boolean;
    rating: number;
    created_at: string;
    driver_count?: number;
    method_count?: number;
}

interface GlobalDriver {
    id: string;
    driver_name: string;
    phone_number: string;
    vehicle_type: string;
    vehicle_number: string;
    is_available: boolean;
    logistics_id: string;
    logistics_profiles?: {
        company_name: string;
    }
}

interface GlobalMethod {
    id: string;
    display_name: string;
    base_cost: number;
    is_active: boolean;
    logistics_id: string;
    logistics_profiles?: {
        company_name: string;
    }
}

type AdminTab = 'partners' | 'fleet' | 'rates';

export function LogisticManagement() {
    const { formatPrice } = useCurrency();

    const [partners, setPartners] = useState<LogisticsPartner[]>([]);
    const [drivers, setDrivers] = useState<GlobalDriver[]>([]);
    const [methods, setMethods] = useState<GlobalMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AdminTab>('partners');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPartner, setSelectedPartner] = useState<LogisticsPartner | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [editFormData, setEditFormData] = useState({
        company_name: '',
        business_email: '',
        business_phone: '',
        description: '',
        is_active: true
    });

    const [registerFormData, setRegisterFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        company_name: '',
        business_phone: ''
    });

    useEffect(() => {
        fetchAdminLogisticsData();
    }, [activeTab]);

    const fetchAdminLogisticsData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'partners') {
                const { data: partnerData, error: partnerError } = await supabase
                    .from('logistics_profiles')
                    .select('*, driver_count:delivery_drivers(count), method_count:shipping_methods(count)')
                    .order('created_at', { ascending: false });

                if (partnerError) throw partnerError;

                const processedPartners = (partnerData || []).map(p => ({
                    ...p,
                    driver_count: (p.driver_count as any)?.[0]?.count || 0,
                    method_count: (p.method_count as any)?.[0]?.count || 0
                }));

                setPartners(processedPartners);
            }
            else if (activeTab === 'fleet') {
                const { data, error } = await supabase
                    .from('delivery_drivers')
                    .select('*, logistics_profiles(company_name)')
                    .order('driver_name');
                if (error) throw error;
                setDrivers(data || []);
            }
            else if (activeTab === 'rates') {
                const { data, error } = await supabase
                    .from('shipping_methods')
                    .select('*, logistics_profiles(company_name)')
                    .not('logistics_id', 'is', null)
                    .order('base_cost');
                if (error) throw error;
                setMethods(data || []);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const togglePartnerVerification = async (partner: LogisticsPartner) => {
        try {
            const { error } = await supabase
                .from('logistics_profiles')
                .update({ is_verified: !partner.is_verified })
                .eq('id', partner.id);

            if (error) throw error;
            setMessage({ type: 'success', text: `Verification status updated for ${partner.company_name}.` });
            fetchAdminLogisticsData();
            if (selectedPartner?.id === partner.id) {
                setSelectedPartner({ ...partner, is_verified: !partner.is_verified });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Update failed: ${error.message}` });
        }
    };

    const togglePartnerStatus = async (partner: LogisticsPartner) => {
        try {
            const { error } = await supabase
                .from('logistics_profiles')
                .update({ is_active: !partner.is_active })
                .eq('id', partner.id);

            if (error) throw error;
            setMessage({ type: 'success', text: `Courier status updated for ${partner.company_name}.` });
            fetchAdminLogisticsData();
            if (selectedPartner?.id === partner.id) {
                setSelectedPartner({ ...partner, is_active: !partner.is_active });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Update failed: ${error.message}` });
        }
    };

    const handleEditPartner = (partner: LogisticsPartner) => {
        setEditFormData({
            company_name: partner.company_name,
            business_email: partner.business_email,
            business_phone: partner.business_phone || '',
            description: partner.description || '',
            is_active: partner.is_active
        });
        setSelectedPartner(partner);
        setShowEditModal(true);
    };

    const updatePartnerDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPartner) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('logistics_profiles')
                .update({
                    company_name: editFormData.company_name,
                    business_email: editFormData.business_email,
                    business_phone: editFormData.business_phone,
                    description: editFormData.description,
                    is_active: editFormData.is_active
                })
                .eq('id', selectedPartner.id);

            if (error) throw error;

            setMessage({ type: 'success', text: `${editFormData.company_name} updated successfully!` });
            setShowEditModal(false);
            setSelectedPartner(null);
            fetchAdminLogisticsData();
        } catch (error: any) {
            setMessage({ type: 'error', text: `Save failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterPartner = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: registerFormData.email,
                password: registerFormData.password,
                options: {
                    data: {
                        full_name: registerFormData.full_name,
                        role: 'logistic'
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Profile and Logistics Profile are handled by database triggers or AuthContext signUp logic usually, 
                // but let's be explicit to ensure no "profile not found" errors happen.
                const { error: pError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: registerFormData.email,
                    full_name: registerFormData.full_name,
                    role: 'logistic' as any,
                    is_active: true,
                    is_verified: true
                });
                if (pError) throw pError;

                const { error: lpError } = await supabase.from('logistics_profiles').insert({
                    user_id: authData.user.id,
                    company_name: registerFormData.company_name,
                    business_email: registerFormData.email,
                    business_phone: registerFormData.business_phone,
                    is_active: true,
                    is_verified: true
                });
                if (lpError) throw lpError;

                setMessage({ type: 'success', text: `Logistics partner ${registerFormData.company_name} registered successfully!` });
                setShowRegisterModal(false);
                setRegisterFormData({ email: '', password: '', full_name: '', company_name: '', business_phone: '' });
                fetchAdminLogisticsData();
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: `Registration failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    // Enforcing white/light theme as requested to remove dark backgrounds completely
    const cardBg = 'bg-white';
    const borderColor = 'border-slate-200';
    const textPrimary = 'text-slate-900';
    const textSecondary = 'text-slate-500';

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Compact Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-lg shadow-emerald-500/20 border border-slate-100">
                            <Truck className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${textPrimary} uppercase`}>Logistics Oversight</h1>
                            <p className={`text-[10px] font-bold ${textSecondary} tracking-wide`}>Global Infrastructure Control</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowRegisterModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition-all shadow-sm uppercase tracking-widest"
                        >
                            <Plus className="h-3 w-3" /> Register Carrier
                        </button>

                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
                            {(['partners', 'fleet', 'rates'] as AdminTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                                        ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Compact KPIs - High Clarity White Background */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Carriers', value: partners.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Fleet', value: drivers.length, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Routes', value: methods.length, icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
                        { label: 'Rating', value: '4.9', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((kpi, i) => (
                        <div key={i} className={`bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between`}>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                                <h3 className={`text-xl font-black ${textPrimary} mt-1`}>{kpi.value}</h3>
                            </div>
                            <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search & Actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative max-w-xs w-full">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textSecondary} h-3.5 w-3.5`} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2.5 bg-white border ${borderColor} rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900/10 outline-none ${textPrimary} shadow-sm`}
                        />
                    </div>
                </div>

                {message && (
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
                    </div>
                )}

                {/* Dense Table - White Background */}
                <div className={`bg-white rounded-xl border ${borderColor} shadow-sm overflow-hidden`}>
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <div className="w-6 h-6 border-2 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={`bg-slate-50 border-b ${borderColor}`}>
                                    <tr>
                                        {activeTab === 'partners' && (
                                            <>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Entity & Status</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Resources</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Verification</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                            </>
                                        )}
                                        {activeTab === 'fleet' && (
                                            <>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Driver</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Vehicle</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Partner</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                            </>
                                        )}
                                        {activeTab === 'rates' && (
                                            <>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Service</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Provider</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Cost</th>
                                                <th className="px-5 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${borderColor}`}>
                                    {activeTab === 'partners' && partners.map((partner) => (
                                        <tr key={partner.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center font-black text-xs text-slate-700">
                                                        {partner.company_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm font-black ${textPrimary}`}>{partner.company_name}</p>
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${partner.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                                {partner.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[10px] font-bold ${textSecondary} mt-0.5`}>{partner.business_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-2">
                                                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600 border border-slate-200">{partner.driver_count} Drivers</span>
                                                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-bold text-slate-600 border border-slate-200">{partner.method_count} Lanes</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex gap-1.5">
                                                    {partner.is_verified ? (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                                            <ShieldCheck className="h-3 w-3" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-wider">
                                                            <ShieldAlert className="h-3 w-3" /> Pending
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditPartner(partner)} className="p-2 bg-slate-100 text-cyan-600 rounded-lg hover:bg-cyan-50 transition-all">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { setSelectedPartner(partner); setShowDetailModal(true); }} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all">
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'fleet' && drivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className={`text-xs font-bold ${textPrimary}`}>{driver.driver_name}</p>
                                                <p className={`text-[10px] font-semibold ${textSecondary}`}>{driver.phone_number}</p>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-500 capitalize">{driver.vehicle_type} - <span className="font-mono uppercase text-slate-900 font-bold">{driver.vehicle_number}</span></td>
                                            <td className="px-5 py-4 text-xs font-bold text-slate-700">{driver.logistics_profiles?.company_name}</td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`text-[9px] font-black uppercase tracking-wider ${driver.is_available ? 'text-emerald-600' : 'text-slate-400'}`}>{driver.is_available ? 'Online' : 'Offline'}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {activeTab === 'rates' && methods.map((method) => (
                                        <tr key={method.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 text-xs font-bold text-slate-800">{method.display_name}</td>
                                            <td className="px-5 py-4 text-xs font-semibold text-slate-500">{method.logistics_profiles?.company_name}</td>
                                            <td className="px-5 py-4 text-xs font-black text-emerald-600">{formatPrice(method.base_cost)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <span className={`text-[9px] font-black uppercase tracking-wider ${method.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>{method.is_active ? 'Active' : 'Locked'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && selectedPartner && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Courier Partner</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <form onSubmit={updatePartnerDetails} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.company_name}
                                    onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Business Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={editFormData.business_email}
                                        onChange={(e) => setEditFormData({ ...editFormData, business_email: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editFormData.business_phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, business_phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5 tracking-wider">Service Description</label>
                                <textarea
                                    rows={3}
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={editFormData.is_active}
                                    onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700 cursor-pointer">Entity Operational (Active)</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Compact Modal - White Background */}
            {showDetailModal && selectedPartner && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border ${borderColor}`}>
                        <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-white">
                            <div>
                                <h2 className={`text-lg font-bold text-slate-900`}>{selectedPartner.company_name}</h2>
                                <p className={`text-[10px] text-slate-500 font-mono uppercase mt-1`}>ID: {selectedPartner.id.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Performance</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-base font-black text-slate-900`}>{selectedPartner.rating}</span>
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Resources</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-base font-black text-slate-900`}>{selectedPartner.driver_count}</span>
                                        <Truck className="h-3.5 w-3.5 text-blue-500" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-xs">
                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-900">{selectedPartner.business_email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-900">{selectedPartner.business_phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="text-slate-900">Joined {new Date(selectedPartner.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50/50 grid grid-cols-2 gap-3">
                            <button
                                onClick={() => togglePartnerVerification(selectedPartner)}
                                className={`py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${selectedPartner.is_verified
                                    ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}
                            >
                                {selectedPartner.is_verified ? 'Revoke Verify' : 'Verify Entity'}
                            </button>
                            <button
                                onClick={() => togglePartnerStatus(selectedPartner)}
                                className={`py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${selectedPartner.is_active
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                            >
                                {selectedPartner.is_active ? 'Suspend Ops' : 'Activate Ops'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Registration Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Register New Carrier</h2>
                            <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>

                        <form onSubmit={handleRegisterPartner} className="p-4 space-y-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Contact Person Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={registerFormData.full_name}
                                    onChange={(e) => setRegisterFormData({ ...registerFormData, full_name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Login Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={registerFormData.email}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                        placeholder="carrier@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Account Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={registerFormData.password}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={registerFormData.company_name}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, company_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                        placeholder="Apex Logistics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-wider">Contact Phone</label>
                                    <input
                                        type="tel"
                                        value={registerFormData.business_phone}
                                        onChange={(e) => setRegisterFormData({ ...registerFormData, business_phone: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-sm"
                                        placeholder="+263..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowRegisterModal(false)} className="flex-1 py-2 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={loading} className="flex-1 py-2 text-xs font-black uppercase tracking-widest text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                                    {loading ? 'Registering...' : 'Register Carrier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
