import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Tag,
    Plus,
    Edit,
    Trash2,
    Calendar,
    Percent,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    X,
    AlertCircle,
    Clock,
    Zap,
    Ticket
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Promotion {
    id: string;
    name: string;
    description: string;
    promo_type: 'coupon' | 'flash_sale' | 'banner';
    code?: string;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
    start_date: string;
    end_date: string;
    is_active: boolean;
    usage_limit?: number;
    usage_count: number;
    min_purchase_amount: number;
    created_at: string;
}

export function PromotionManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        promo_type: 'coupon',
        code: '',
        discount_value: 0,
        discount_type: 'percentage',
        start_date: '',
        end_date: '',
        is_active: true,
        usage_limit: 0,
        min_purchase_amount: 0,
    });

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPromotions(data || []);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editingPromotion) {
                const { error } = await supabase
                    .from('promotions')
                    .update(formData)
                    .eq('id', editingPromotion.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Promotion updated successfully' });
            } else {
                const { error } = await supabase
                    .from('promotions')
                    .insert([formData]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Promotion created successfully' });
            }

            fetchPromotions();
            handleCloseModal();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (promo: Promotion) => {
        setEditingPromotion(promo);
        setFormData({
            name: promo.name,
            description: promo.description,
            promo_type: promo.promo_type,
            code: promo.code || '',
            discount_value: promo.discount_value,
            discount_type: promo.discount_type,
            start_date: promo.start_date.split('T')[0],
            end_date: promo.end_date.split('T')[0],
            is_active: promo.is_active,
            usage_limit: promo.usage_limit || 0,
            min_purchase_amount: promo.min_purchase_amount,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return;

        try {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Promotion deleted successfully' });
            fetchPromotions();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleToggleStatus = async (promo: Promotion) => {
        try {
            const { error } = await supabase
                .from('promotions')
                .update({ is_active: !promo.is_active })
                .eq('id', promo.id);
            if (error) throw error;
            fetchPromotions();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPromotion(null);
        setFormData({
            name: '',
            description: '',
            promo_type: 'coupon',
            code: '',
            discount_value: 0,
            discount_type: 'percentage',
            start_date: '',
            end_date: '',
            is_active: true,
            usage_limit: 0,
            min_purchase_amount: 0,
        });
    };

    const filteredPromotions = promotions.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.code?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || p.promo_type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl shadow-indigo-100 dark:shadow-none shadow-lg">
                                <Tag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Promotion Management</h1>
                        </div>
                        <p className={textSecondary}>Create and manage discount codes, flash sales, and platform campaigns.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Add Promotion
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                        : 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                    }`}>
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-bold flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)}><X className="h-5 w-5" /></button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm group hover:shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Ticket className="h-6 w-6" />
                        </div>
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Total Promos</p>
                    <h2 className={`text-3xl font-black ${textPrimary} mt-1`}>{promotions.length}</h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm group hover:shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Active Now</p>
                    <h2 className={`text-3xl font-black text-emerald-600 mt-1`}>{promotions.filter(p => p.is_active).length}</h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm group hover:shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <Zap className="h-6 w-6" />
                        </div>
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Total Usages</p>
                    <h2 className={`text-3xl font-black ${textPrimary} mt-1`}>{promotions.reduce((acc, p) => acc + p.usage_count, 0)}</h2>
                </div>
                <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm group hover:shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                    <p className={`text-sm font-bold uppercase tracking-widest ${textSecondary}`}>Expiring Soon</p>
                    <h2 className={`text-3xl font-black text-rose-600 mt-1`}>
                        {promotions.filter(p => {
                            const daysLeft = (new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                            return daysLeft > 0 && daysLeft < 7;
                        }).length}
                    </h2>
                </div>
            </div>

            {/* Filters & Search */}
            <div className={`${cardBg} p-6 rounded-[32px] border ${borderColor} shadow-sm mb-8`}>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="relative flex-1">
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${textSecondary} h-5 w-5`} />
                        <input
                            type="text"
                            placeholder="Search by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-12 pr-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className={`h-5 w-5 ${textSecondary}`} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className={`px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                            >
                                <option value="all">All Types</option>
                                <option value="coupon">Coupons</option>
                                <option value="flash_sale">Flash Sales</option>
                                <option value="banner">Banner Promos</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Promotions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`${cardBg} h-64 rounded-[40px] animate-pulse border ${borderColor}`} />
                    ))
                ) : filteredPromotions.map((promo) => (
                    <div key={promo.id} className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                        <div className={`h-3 ${promo.is_active ? 'bg-indigo-600' : 'bg-gray-400'}`} />
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${promo.promo_type === 'coupon' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                promo.promo_type === 'flash_sale' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            }`}>
                                            {promo.promo_type.replace('_', ' ')}
                                        </span>
                                        {promo.is_active ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                Live
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 dark:border-gray-600">
                                                Disabled
                                            </span>
                                        )}
                                    </div>
                                    <h3 className={`text-2xl font-black ${textPrimary} uppercase tracking-tight line-clamp-1`}>{promo.name}</h3>
                                </div>
                            </div>

                            <div className={`p-4 rounded-3xl mb-6 flex items-center justify-between ${isDark ? 'bg-gray-700/50' : 'bg-indigo-50/50'}`}>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Discount</span>
                                    <span className={`text-2xl font-black ${textPrimary}`}>
                                        {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                                    </span>
                                </div>
                                {promo.code && (
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>Code</span>
                                        <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30">
                                            {promo.code}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        <span className="font-bold uppercase text-[10px] tracking-widest">Validity</span>
                                    </div>
                                    <span className={`font-bold ${textPrimary}`}>
                                        {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Zap className="h-4 w-4" />
                                        <span className="font-bold uppercase text-[10px] tracking-widest">Usage</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`font-bold ${textPrimary}`}>
                                            {promo.usage_count} / {promo.usage_limit || '∞'}
                                        </span>
                                        <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-600"
                                                style={{ width: `${Math.min(100, (promo.usage_count / (promo.usage_limit || 100)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => handleEdit(promo)}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-900/30 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-2xl font-bold transition-all duration-300"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleStatus(promo)}
                                    className={`p-3 rounded-2xl transition-all duration-300 ${promo.is_active
                                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white dark:bg-rose-900/30 dark:hover:bg-rose-600'
                                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:hover:bg-emerald-600'
                                        }`}
                                >
                                    {promo.is_active ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                </button>
                                <button
                                    onClick={() => handleDelete(promo.id)}
                                    className="p-3 bg-gray-50 text-gray-400 hover:bg-rose-600 hover:text-white dark:bg-gray-700 dark:hover:bg-rose-600 rounded-2xl transition-all duration-300"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && filteredPromotions.length === 0 && (
                    <div className="col-span-full py-20 bg-gray-50 dark:bg-gray-800/50 rounded-[48px] border-4 border-dashed border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-xl mb-6">
                            <Ticket className="h-16 w-16 text-gray-200 dark:text-gray-600" />
                        </div>
                        <h3 className={`text-2xl font-black uppercase tracking-tight ${textPrimary}`}>No Promotions Found</h3>
                        <p className={`${textSecondary} mt-2 max-w-sm`}>Try adjusting your search filters or create a new campaign to get started.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className={`${cardBg} rounded-[48px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-indigo-600 text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">
                                    {editingPromotion ? 'Edit Campaign' : 'New Campaign'}
                                </h2>
                                <p className="text-white/70 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Platform-wide promotion configuration</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Campaign Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 font-bold'}`}
                                            placeholder="e.g., Summer Mega Sale 2026"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Promo Type</label>
                                        <select
                                            value={formData.promo_type}
                                            onChange={(e) => setFormData({ ...formData, promo_type: e.target.value as any })}
                                            className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                        >
                                            <option value="coupon">Coupon Code</option>
                                            <option value="flash_sale">Flash Sale</option>
                                            <option value="banner">Banner Promo</option>
                                        </select>
                                    </div>

                                    {formData.promo_type === 'coupon' && (
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Coupon Code *</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase font-mono tracking-widest ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-indigo-50/50'}`}
                                                placeholder="SUMMER50"
                                            />
                                        </div>
                                    )}

                                    <div className="p-6 bg-slate-50 dark:bg-gray-900/40 rounded-[32px] md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Discount Value *</label>
                                            <div className="flex gap-4">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={formData.discount_value}
                                                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                                                    className={`flex-1 px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
                                                />
                                                <select
                                                    value={formData.discount_type}
                                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                                    className={`px-4 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
                                                >
                                                    <option value="percentage">%</option>
                                                    <option value="fixed">$</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Min purchase Amount</label>
                                            <input
                                                type="number"
                                                value={formData.min_purchase_amount}
                                                onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white font-bold'}`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Start Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 font-bold'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>End Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50 font-bold'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-3`}>Usage Limit (0 for ∞)</label>
                                        <input
                                            type="number"
                                            value={formData.usage_limit}
                                            onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                                            className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className="flex items-center gap-4 group"
                                        >
                                            <div className={`w-14 h-8 rounded-full p-1 transition-all ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${formData.is_active ? 'translate-x-6' : ''}`} />
                                            </div>
                                            <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Promotion Active</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : editingPromotion ? 'Save Changes' : 'Create Promotion'}
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
