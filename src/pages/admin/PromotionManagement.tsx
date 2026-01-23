import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Tag, Plus, Edit, Trash2, Calendar, Percent, CheckCircle, XCircle, Search, Filter, X, AlertCircle, Clock, Zap, Ticket } from 'lucide-react';

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

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('promotions').select('*').order('start_date', { ascending: false });
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
                const { error } = await supabase.from('promotions').update(formData).eq('id', editingPromotion.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Promotion updated' });
            } else {
                const { error } = await supabase.from('promotions').insert([formData]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Promotion created' });
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
        if (!confirm('Delete this promotion?')) return;
        try {
            const { error } = await supabase.from('promotions').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Promotion deleted' });
            fetchPromotions();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleToggleStatus = async (promo: Promotion) => {
        try {
            const { error } = await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
            if (error) throw error;
            fetchPromotions();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPromotion(null);
        setFormData({ name: '', description: '', promo_type: 'coupon', code: '', discount_value: 0, discount_type: 'percentage', start_date: '', end_date: '', is_active: true, usage_limit: 0, min_purchase_amount: 0 });
    };

    const filteredPromotions = promotions.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || p.promo_type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
                            <Tag className="w-6 h-6 mr-2 text-indigo-600" />
                            Promotion Management
                        </h1>
                        <p className="text-slate-600 mt-1 text-sm">Create and manage discount codes and campaigns</p>
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                    </button>
                </div>

                {message && (
                    <div className={`p-2 rounded flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        <AlertCircle className="w-4 h-4" />
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Ticket className="w-5 h-5 text-indigo-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Total</p>
                        <h2 className="text-2xl font-bold text-slate-900">{promotions.length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Active</p>
                        <h2 className="text-2xl font-bold text-emerald-600">{promotions.filter(p => p.is_active).length}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Usages</p>
                        <h2 className="text-2xl font-bold text-slate-900">{promotions.reduce((acc, p) => acc + p.usage_count, 0)}</h2>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-rose-600" />
                        </div>
                        <p className="text-xs text-slate-600 uppercase">Expiring</p>
                        <h2 className="text-2xl font-bold text-rose-600">
                            {promotions.filter(p => {
                                const daysLeft = (new Date(p.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                                return daysLeft > 0 && daysLeft < 7;
                            }).length}
                        </h2>
                    </div>
                </div>

                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                                <option value="all">All Types</option>
                                <option value="coupon">Coupons</option>
                                <option value="flash_sale">Flash Sales</option>
                                <option value="banner">Banners</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-gray-50 h-48 rounded animate-pulse border border-gray-200" />
                        ))
                    ) : filteredPromotions.map((promo) => (
                        <div key={promo.id} className="bg-gray-50 rounded border border-gray-200 overflow-hidden hover:shadow-md transition">
                            <div className={`h-2 ${promo.is_active ? 'bg-indigo-600' : 'bg-gray-400'}`} />
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${promo.promo_type === 'coupon' ? 'bg-indigo-100 text-indigo-700' : promo.promo_type === 'flash_sale' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {promo.promo_type.replace('_', ' ')}
                                            </span>
                                            {promo.is_active && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                                    Live
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">{promo.name}</h3>
                                    </div>
                                </div>

                                <div className="p-2 rounded bg-indigo-50 mb-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-slate-600">Discount</span>
                                        <p className="text-xl font-bold text-slate-900">
                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                                        </p>
                                    </div>
                                    {promo.code && (
                                        <div className="text-right">
                                            <span className="text-xs text-slate-600">Code</span>
                                            <p className="text-sm font-bold font-mono text-indigo-600 bg-white px-2 py-1 rounded">{promo.code}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4 text-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>Validity</span>
                                        </div>
                                        <span className="font-medium text-slate-900">
                                            {new Date(promo.start_date).toLocaleDateString()} - {new Date(promo.end_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-gray-500">
                                            <Zap className="w-3 h-3" />
                                            <span>Usage</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="font-medium text-slate-900">{promo.usage_count} / {promo.usage_limit || '∞'}</span>
                                            <div className="w-24 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                                <div className="h-full bg-indigo-600" style={{ width: `${Math.min(100, (promo.usage_count / (promo.usage_limit || 100)) * 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                                    <button onClick={() => handleEdit(promo)} className="flex-1 flex items-center justify-center gap-1 py-1 bg-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded transition text-sm">
                                        <Edit className="w-3 h-3" />
                                        Edit
                                    </button>
                                    <button onClick={() => handleToggleStatus(promo)} className={`p-1 rounded transition ${promo.is_active ? 'bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}>
                                        {promo.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => handleDelete(promo.id)} className="p-1 bg-gray-100 text-gray-400 hover:bg-rose-600 hover:text-white rounded transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && filteredPromotions.length === 0 && (
                        <div className="col-span-full py-12 bg-gray-50 rounded border-2 border-dashed border-gray-200 flex flex-col items-center text-center">
                            <Ticket className="w-12 h-12 text-gray-300 mb-3" />
                            <h3 className="text-lg font-bold text-slate-900">No Promotions Found</h3>
                            <p className="text-sm text-slate-600">Try adjusting filters or create a new campaign</p>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-indigo-600 text-white">
                                <div>
                                    <h2 className="text-xl font-bold">{editingPromotion ? 'Edit Campaign' : 'New Campaign'}</h2>
                                    <p className="text-xs text-white/70">Configure promotion details</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-1 hover:bg-white/20 rounded transition">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Campaign Name *</label>
                                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" placeholder="Summer Sale 2026" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                                            <select value={formData.promo_type} onChange={(e) => setFormData({ ...formData, promo_type: e.target.value as any })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                                                <option value="coupon">Coupon Code</option>
                                                <option value="flash_sale">Flash Sale</option>
                                                <option value="banner">Banner Promo</option>
                                            </select>
                                        </div>

                                        {formData.promo_type === 'coupon' && (
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Code *</label>
                                                <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm uppercase font-mono" placeholder="SUMMER50" />
                                            </div>
                                        )}

                                        <div className="p-3 bg-slate-50 rounded md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Discount Value *</label>
                                                <div className="flex gap-2">
                                                    <input type="number" step="0.01" required value={formData.discount_value} onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })} className="flex-1 px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                                                    <select value={formData.discount_type} onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })} className="px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm">
                                                        <option value="percentage">%</option>
                                                        <option value="fixed">$</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Min Purchase</label>
                                                <input type="number" value={formData.min_purchase_amount} onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Start Date *</label>
                                            <input type="date" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">End Date *</label>
                                            <input type="date" required value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Usage Limit (0 for ∞)</label>
                                            <input type="number" value={formData.usage_limit} onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })} className="w-full px-2 py-1 rounded border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white text-sm" />
                                        </div>

                                        <div className="flex items-center">
                                            <button type="button" onClick={() => setFormData({ ...formData, is_active: !formData.is_active })} className="flex items-center gap-2">
                                                <div className={`w-10 h-5 rounded-full p-0.5 transition ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.is_active ? 'translate-x-5' : ''}`} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">Active</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200 flex justify-end">
                                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50 text-sm">
                                            {loading ? 'Processing...' : editingPromotion ? 'Save Changes' : 'Create Promotion'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
