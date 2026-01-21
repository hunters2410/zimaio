import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Truck,
    MapPin,
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Check,
    AlertCircle,
    Globe,
    DollarSign,
    Clock,
    Navigation
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
}

interface ShippingZone {
    id: string;
    name: string;
    regions: string[];
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

    const [formData, setFormData] = useState<any>({
        name: '',
        display_name: '',
        description: '',
        base_cost: 0,
        delivery_time_min: 1,
        delivery_time_max: 3,
        is_active: true,
        is_global: true,
        regions: [],
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

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from(table)
                    .update(formData)
                    .eq('id', editingItem.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Shipping item updated successfully' });
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert([formData]);
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
            delivery_time_min: 1,
            delivery_time_max: 3,
            is_active: true,
            is_global: true,
            regions: [],
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
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-rose-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Add {activeTab === 'methods' ? 'Method' : 'Zone'}
                    </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`${cardBg} h-64 rounded-[40px] animate-pulse border ${borderColor}`} />
                    ))
                ) : activeTab === 'methods' ? (
                    methods.map((method) => (
                        <div key={method.id} className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-3xl text-orange-600 dark:text-orange-400">
                                        <Truck className="h-8 w-8" />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${method.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                                            {method.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                        {method.is_global && (
                                            <span className="mt-2 text-indigo-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <Globe className="h-3 w-3" /> Global
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <h3 className={`text-2xl font-black ${textPrimary} uppercase tracking-tight`}>{method.display_name}</h3>
                                <p className={`text-sm ${textSecondary} mt-2 line-clamp-2`}>{method.description || 'No description provided.'}</p>

                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-gray-700/50">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Base Cost</span>
                                        <p className={`text-lg font-black ${textPrimary}`}>{formatPrice(method.base_cost)}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-gray-700/50">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Est. Time</span>
                                        <p className={`text-lg font-black ${textPrimary}`}>{method.delivery_time_min}-{method.delivery_time_max} Days</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={() => handleEdit(method)} className="flex-1 py-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl font-bold text-sm hover:bg-orange-600 hover:text-white transition-all">
                                        Configure
                                    </button>
                                    <button onClick={() => handleDelete(method.id)} className="p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    zones.map((zone) => (
                        <div key={zone.id} className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-3xl text-rose-600 dark:text-rose-400">
                                        <MapPin className="h-8 w-8" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${zone.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                                        {zone.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                                <h3 className={`text-2xl font-black ${textPrimary} uppercase tracking-tight`}>{zone.name}</h3>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {zone.regions.map((region, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                            {region}
                                        </span>
                                    ))}
                                    {zone.regions.length === 0 && <span className={`text-xs ${textSecondary} italic`}>No regions assigned</span>}
                                </div>
                                <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={() => handleEdit(zone)} className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all">
                                        Edit Zone
                                    </button>
                                    <button onClick={() => handleDelete(zone.id)} className="p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className={`${cardBg} rounded-[48px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-orange-600 text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">
                                    {editingItem ? 'Edit ' : 'New '}{activeTab === 'methods' ? 'Method' : 'Zone'}
                                </h2>
                            </div>
                            <button onClick={handleCloseModal} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {activeTab === 'methods' ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Method Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.display_name}
                                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value, name: e.target.value.toLowerCase().replace(/ /g, '_') })}
                                                    className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                    placeholder="Standard Shipping"
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Base Cost *</label>
                                                <div className="relative">
                                                    <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${textSecondary}`} />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        required
                                                        value={formData.base_cost}
                                                        onChange={(e) => setFormData({ ...formData, base_cost: parseFloat(e.target.value) })}
                                                        className={`w-full pl-12 pr-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                placeholder="Typical delivery within 3-5 business days."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Min Days</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.delivery_time_min}
                                                    onChange={(e) => setFormData({ ...formData, delivery_time_min: parseInt(e.target.value) })}
                                                    className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Max Days</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={formData.delivery_time_max}
                                                    onChange={(e) => setFormData({ ...formData, delivery_time_max: parseInt(e.target.value) })}
                                                    className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Zone Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-rose-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                placeholder="Harare Central"
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Regions / Neighborhoods (comma separated)</label>
                                            <textarea
                                                value={formData.regions.join(', ')}
                                                onChange={(e) => setFormData({ ...formData, regions: e.target.value.split(',').map(r => r.trim()).filter(r => r !== '') })}
                                                rows={4}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-rose-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                                placeholder="Mount Pleasant, Avondale, Borrowdale..."
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className={`w-14 h-8 rounded-full p-1 transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${formData.is_active ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Option Active</span>
                                        </button>
                                    </div>
                                    {activeTab === 'methods' && (
                                        <div className="flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, is_global: !formData.is_global })}
                                                className="flex items-center gap-4 group"
                                            >
                                                <div className={`w-14 h-8 rounded-full p-1 transition-all ${formData.is_global ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${formData.is_global ? 'translate-x-6' : ''}`} />
                                                </div>
                                                <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Global Method</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-12 py-5 bg-gradient-to-r from-orange-600 to-rose-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
