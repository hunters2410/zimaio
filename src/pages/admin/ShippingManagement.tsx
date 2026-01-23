import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Truck,
    MapPin,
    Plus,
    Edit,
    Trash2,
    X,
    AlertCircle,
    Globe
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';

interface ShippingMethod {
    id: string;
    name: string;
    display_name: string;
    description?: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
    is_active: boolean;
    is_global: boolean;
    regions?: string[];
    min_order_total: number;
    max_order_total: number | null;
}

interface ShippingZone {
    id: string;
    name: string;
    regions: string[];
    base_rate: number;
    per_kg_rate: number;
    min_order_total: number;
    max_order_total: number | null;
    is_active: boolean;
}

export function ShippingManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { formatPrice } = useCurrency();

    const [methods, setMethods] = useState<ShippingMethod[]>([]);
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'methods' | 'zones'>('methods');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const [formData, setFormData] = useState<any>({
        name: '',
        display_name: '',
        description: '',
        base_cost: 0,
        base_rate: 0,
        per_kg_rate: 0,
        delivery_time_min: 1,
        delivery_time_max: 3,
        is_active: true,
        is_global: true,
        regions: [],
        min_order_total: 0,
        max_order_total: null,
    });

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'methods') {
                const { data, error } = await supabase
                    .from('shipping_methods')
                    .select('*')
                    .order('base_cost', { ascending: true });
                if (error) throw error;
                setMethods(data || []);
            } else {
                const { data, error } = await supabase
                    .from('shipping_zones')
                    .select('*')
                    .order('name', { ascending: true });
                if (error) throw error;
                setZones(data || []);
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const table = activeTab === 'methods' ? 'shipping_methods' : 'shipping_zones';

        // Filter formData to only include relevant fields for each table
        const submissionData: any = { ...formData };

        // Remove the id if it's a new record to avoid conflicts
        if (!editingItem) {
            delete submissionData.id;
        }

        if (activeTab === 'methods') {
            delete submissionData.regions;
            // Admin created methods from this page are global by default
            submissionData.is_global = submissionData.is_global ?? true;
        } else {
            // For zones, remove method-specific fields
            delete submissionData.display_name;
            delete submissionData.description;
            delete submissionData.base_cost;
            delete submissionData.delivery_time_min;
            delete submissionData.delivery_time_max;
            delete submissionData.is_global;
        }

        // Ensure logistics_id is null for global admin methods if not set
        if (!submissionData.logistics_id) {
            submissionData.logistics_id = null;
        }

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from(table)
                    .update(submissionData)
                    .eq('id', editingItem.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Shipping item updated successfully' });
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert([submissionData]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Shipping item created successfully' });
            }

            fetchData();
            handleCloseModal();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shipping option?')) return;

        const table = activeTab === 'methods' ? 'shipping_methods' : 'shipping_zones';
        try {
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Item deleted successfully' });
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFormData({
            name: '',
            display_name: '',
            description: '',
            base_cost: 0,
            base_rate: 0,
            per_kg_rate: 0,
            delivery_time_min: 1,
            delivery_time_max: 3,
            is_active: true,
            is_global: true,
            regions: [],
            min_order_total: 0,
            max_order_total: null,
        });
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                                <Truck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Shipping Management</h1>
                        </div>
                        <p className={textSecondary}>Configure shipping methods, rates, and zones for your logistics network.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-orange-600' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-rose-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="h-5 w-5" />
                            Add {activeTab === 'methods' ? 'Method' : 'Zone'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('methods')}
                    className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'methods'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : `${cardBg} ${textSecondary} border ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700`
                        }`}
                >
                    Shipping Methods
                </button>
                <button
                    onClick={() => setActiveTab('zones')}
                    className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'zones'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : `${cardBg} ${textSecondary} border ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700`
                        }`}
                >
                    Delivery Zones
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-bold flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)}><X className="h-5 w-5" /></button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`${cardBg} h-64 rounded-3xl animate-pulse border ${borderColor}`} />
                    ))}
                </div>
            ) : (
                activeTab === 'methods' ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {methods.map((method) => (
                                <div key={method.id} className={`${cardBg} rounded-3xl border ${borderColor} shadow-sm group hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
                                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                                        <span className={`w-2 h-2 rounded-full ${method.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        {method.is_global && <Globe className="h-3 w-3 text-indigo-500" />}
                                    </div>

                                    <div className="p-6">
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-orange-600 dark:text-orange-400 w-fit mb-4">
                                            <Truck className="h-5 w-5" />
                                        </div>

                                        <h3 className={`font-bold ${textPrimary} truncate mb-1`}>{method.display_name}</h3>
                                        <p className={`text-xs ${textSecondary} line-clamp-2 min-h-[2rem]`}>{method.description || 'No description'}</p>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Rate</p>
                                                <p className={`text-lg font-black ${textPrimary}`}>{formatPrice(method.base_cost)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">ETA</p>
                                                <p className={`text-sm font-bold ${textPrimary}`}>{method.delivery_time_min}-{method.delivery_time_max}d</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/20">
                                            <p className="text-[9px] uppercase font-black text-indigo-400 mb-1">Order Value Trigger</p>
                                            <p className={`text-xs font-bold ${textPrimary}`}>
                                                {method.min_order_total > 0 ? formatPrice(method.min_order_total) : '$0'}
                                                {method.max_order_total ? ` - ${formatPrice(method.max_order_total)}` : ' +'}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            <button onClick={() => handleEdit(method)} className="flex-1 py-2 bg-slate-900 dark:bg-slate-700 text-white dark:text-gray-100 rounded-xl font-bold text-xs hover:bg-orange-600 transition-all">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(method.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${cardBg} rounded-3xl border ${borderColor} shadow-sm overflow-hidden`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className={`bg-gray-50 dark:bg-gray-700/50 border-b ${borderColor}`}>
                                        <tr>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Method Name</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Rate & ETA</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Status</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary} text-right`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {methods.map((method) => (
                                            <tr key={method.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${textPrimary}`}>{method.display_name}</span>
                                                        <span className={`text-xs ${textSecondary}`}>{method.description || 'No description'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${textPrimary}`}>{formatPrice(method.base_cost)}</span>
                                                        <span className={`text-xs ${textSecondary}`}>{method.delivery_time_min}-{method.delivery_time_max} Days</span>
                                                        <span className="text-[9px] text-indigo-500 font-black uppercase">
                                                            Range: {formatPrice(method.min_order_total)} {method.max_order_total ? `- ${formatPrice(method.max_order_total)}` : '+'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${method.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {method.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                        {method.is_global && (
                                                            <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600">
                                                                Global
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleEdit(method)} className="p-2 text-slate-400 hover:text-orange-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDelete(method.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {zones.map((zone) => (
                                <div key={zone.id} className={`${cardBg} rounded-3xl border ${borderColor} shadow-sm group hover:shadow-xl transition-all duration-300`}>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <span className={`w-2 h-2 rounded-full ${zone.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>
                                        <h3 className={`font-bold ${textPrimary} mb-3`}>{zone.name}</h3>

                                        <div className="flex justify-between items-center mb-4 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                                            <div>
                                                <p className="text-[9px] uppercase font-black text-slate-400">Base Rate</p>
                                                <p className={`text-sm font-black ${textPrimary}`}>{formatPrice(zone.base_rate)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] uppercase font-black text-slate-400">Add. Per KG</p>
                                                <p className={`text-sm font-black ${textPrimary}`}>+{formatPrice(zone.per_kg_rate)}</p>
                                            </div>
                                        </div>
                                        <div className="mb-4 p-2.5 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800/20">
                                            <p className="text-[9px] uppercase font-black text-indigo-400 mb-0.5">Price Range Trigger</p>
                                            <p className={`text-[11px] font-bold ${textPrimary}`}>
                                                {formatPrice(zone.min_order_total)} {zone.max_order_total ? `- ${formatPrice(zone.max_order_total)}` : '+'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 line-clamp-2 overflow-hidden h-[3.5rem]">
                                            {zone.regions.map((region, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                    {region}
                                                </span>
                                            ))}
                                            {zone.regions.length === 0 && <span className={`text-[10px] ${textSecondary} italic`}>No regions</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <button onClick={() => handleEdit(zone)} className="flex-1 py-2 bg-slate-900 dark:bg-slate-700 text-white dark:text-gray-100 rounded-xl font-bold text-xs hover:bg-rose-600 transition-all">
                                                Configure
                                            </button>
                                            <button onClick={() => handleDelete(zone.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`${cardBg} rounded-3xl border ${borderColor} shadow-sm overflow-hidden`}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className={`bg-gray-50 dark:bg-gray-700/50 border-b ${borderColor}`}>
                                        <tr>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Zone Name</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Rates</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Regions</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary}`}>Status</th>
                                            <th className={`px-6 py-4 font-black uppercase tracking-widest text-[10px] ${textSecondary} text-right`}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {zones.map((zone) => (
                                            <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={`font-bold text-sm ${textPrimary}`}>{zone.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${textPrimary}`}>{formatPrice(zone.base_rate)}</span>
                                                        <span className={`text-[10px] ${textSecondary}`}>+{formatPrice(zone.per_kg_rate)}/kg</span>
                                                        <span className="text-[9px] text-indigo-500 font-black uppercase">
                                                            Cart: {formatPrice(zone.min_order_total)} {zone.max_order_total ? `- ${formatPrice(zone.max_order_total)}` : '+'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {zone.regions.slice(0, 5).map((region, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                                {region}
                                                            </span>
                                                        ))}
                                                        {zone.regions.length > 5 && (
                                                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                                +{zone.regions.length - 5} more
                                                            </span>
                                                        )}
                                                        {zone.regions.length === 0 && <span className={`text-[10px] ${textSecondary} italic`}>No regions</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${zone.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {zone.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleEdit(zone)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={() => handleDelete(zone.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                )
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className={`${cardBg} rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col border ${borderColor}`}>
                        <div className="p-6 border-b ${borderColor} flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Truck className="h-4 w-4 text-orange-600" />
                                </div>
                                {editingItem ? 'Edit' : 'Create'} {activeTab === 'methods' ? 'Method' : 'Zone'}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {activeTab === 'methods' ? (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Label Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.display_name}
                                                onChange={(e) => setFormData({ ...formData, display_name: e.target.value, name: e.target.value.toLowerCase().replace(/ /g, '_') })}
                                                className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                                placeholder="e.g. Express Priority"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Base Cost ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={formData.base_cost}
                                                    onChange={(e) => setFormData({ ...formData, base_cost: parseFloat(e.target.value) })}
                                                    className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Delivery Time (Days)</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        required
                                                        value={formData.delivery_time_min}
                                                        onChange={(e) => setFormData({ ...formData, delivery_time_min: parseInt(e.target.value) })}
                                                        className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'} text-center`}
                                                        placeholder="Min"
                                                    />
                                                    <span className="text-slate-300">-</span>
                                                    <input
                                                        type="number"
                                                        required
                                                        value={formData.delivery_time_max}
                                                        onChange={(e) => setFormData({ ...formData, delivery_time_max: parseInt(e.target.value) })}
                                                        className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'} text-center`}
                                                        placeholder="Max"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Internal Notes / Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'} resize-none text-sm`}
                                                placeholder="Brief description for customer and admin..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Zone Identity</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                                placeholder="e.g. Northern Highveld"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Base Rate ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={formData.base_rate}
                                                    onChange={(e) => setFormData({ ...formData, base_rate: parseFloat(e.target.value) })}
                                                    className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Add. Per KG ($)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.per_kg_rate}
                                                    onChange={(e) => setFormData({ ...formData, per_kg_rate: parseFloat(e.target.value) })}
                                                    className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Assigned Regions (Comma separated)</label>
                                            <textarea
                                                value={formData.regions.join(', ')}
                                                onChange={(e) => setFormData({ ...formData, regions: e.target.value.split(',').map(r => r.trim()).filter(r => r !== '') })}
                                                rows={3}
                                                className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-rose-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'} resize-none text-sm`}
                                                placeholder="Suburb 1, Area 2, District 3..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4 py-2 border-t border-gray-100 dark:border-gray-800">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Min Order Value ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.min_order_total}
                                            onChange={(e) => setFormData({ ...formData, min_order_total: parseFloat(e.target.value) })}
                                            className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 ml-1">Max Order Value (Optional)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.max_order_total || ''}
                                            onChange={(e) => setFormData({ ...formData, max_order_total: e.target.value ? parseFloat(e.target.value) : null })}
                                            className={`w-full px-4 py-3 rounded-xl border ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-slate-50'}`}
                                            placeholder="No limit"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all ${formData.is_active ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-700/50 dark:border-slate-600'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${formData.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Active Status</span>
                                    </button>
                                    {activeTab === 'methods' && (
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_global: !formData.is_global })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all ${formData.is_global ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-700/50 dark:border-slate-600'}`}
                                        >
                                            <Globe className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Global Access</span>
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] active:scale-98 transition-all text-xs mt-4"
                                >
                                    {editingItem ? 'Publish Updates' : 'Confirm & Create'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
