import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Package,
    Plus,
    Trash2,
    X,
    AlertCircle,
    FolderTree,
    Tag
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    image_url?: string;
    is_active: boolean;
    sort_order: number;
}

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    is_active: boolean;
}

export function CatalogManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [formData, setFormData] = useState<any>({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        image_url: '',
        is_active: true,
        sort_order: 0,
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
            if (activeTab === 'categories') {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .order('sort_order', { ascending: true });
                if (error) throw error;
                setCategories(data || []);
            } else {
                const { data, error } = await supabase
                    .from('brands')
                    .select('*')
                    .order('name', { ascending: true });
                if (error) throw error;
                setBrands(data || []);
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

        const table = activeTab === 'categories' ? 'categories' : 'brands';

        try {
            if (editingItem) {
                const { error } = await supabase
                    .from(table)
                    .update(formData)
                    .eq('id', editingItem.id);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Catalog item updated successfully' });
            } else {
                const { error } = await supabase
                    .from(table)
                    .insert([formData]);
                if (error) throw error;
                setMessage({ type: 'success', text: 'Catalog item created successfully' });
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
        if (!confirm('Are you sure you want to delete this item?')) return;

        const table = activeTab === 'categories' ? 'categories' : 'brands';
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
            slug: '',
            description: '',
            parent_id: '',
            image_url: '',
            is_active: true,
            sort_order: 0,
        });
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl">
                                <FolderTree className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <h1 className={`text-3xl font-black uppercase tracking-tight ${textPrimary}`}>Catalog Management</h1>
                        </div>
                        <p className={textSecondary}>Manage product categories and brands to organize your marketplace.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Add {activeTab === 'categories' ? 'Category' : 'Brand'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'categories'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : `${cardBg} ${textSecondary} border ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700`
                        }`}
                >
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'brands'
                        ? 'bg-cyan-600 text-white shadow-lg'
                        : `${cardBg} ${textSecondary} border ${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700`
                        }`}
                >
                    Brands
                </button>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400'
                    }`}>
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="font-bold flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)}><X className="h-5 w-5" /></button>
                </div>
            )}

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`${cardBg} h-64 rounded-[40px] animate-pulse border ${borderColor}`} />
                    ))
                ) : activeTab === 'categories' ? (
                    categories.map((cat) => (
                        <div key={cat.id} className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500`}>
                            <div className="h-40 relative bg-gray-100 dark:bg-gray-700">
                                {cat.image_url ? (
                                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${cat.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                                        {cat.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className={`text-xl font-black ${textPrimary} uppercase tracking-tight`}>{cat.name}</h3>
                                <p className={`text-xs ${textSecondary} mt-1 line-clamp-1`}>{cat.description || 'No description'}</p>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button onClick={() => handleEdit(cat)} className="flex-1 py-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl font-bold text-xs hover:bg-cyan-100 transition">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    brands.map((brand) => (
                        <div key={brand.id} className={`${cardBg} rounded-[40px] border ${borderColor} shadow-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 text-center p-8`}>
                            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center p-4">
                                {brand.logo_url ? (
                                    <img src={brand.logo_url} alt={brand.name} className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <Tag className="h-10 w-10 text-gray-300" />
                                )}
                            </div>
                            <h3 className={`text-xl font-black ${textPrimary} uppercase tracking-tight mb-2`}>{brand.name}</h3>
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <button onClick={() => handleEdit(brand)} className="px-6 py-2 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl font-bold text-xs hover:bg-cyan-100 transition">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(brand.id)} className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className={`${cardBg} rounded-[48px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20`}>
                        <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-cyan-600 text-white">
                            <div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter">
                                    {editingItem ? 'Edit ' : 'New '}{activeTab === 'categories' ? 'Category' : 'Brand'}
                                </h2>
                            </div>
                            <button onClick={handleCloseModal} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Slug * (URL friendly)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                        className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                    />
                                </div>
                                {activeTab === 'categories' && (
                                    <>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>Sort Order</label>
                                            <input
                                                type="number"
                                                value={formData.sort_order}
                                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                                className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2`}>
                                        {activeTab === 'categories' ? 'Image URL' : 'Logo URL'}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.image_url || formData.logo_url}
                                        onChange={(e) => setFormData({ ...formData, [activeTab === 'categories' ? 'image_url' : 'logo_url']: e.target.value })}
                                        className={`w-full px-6 py-4 rounded-2xl border ${borderColor} focus:outline-none focus:ring-4 focus:ring-cyan-500/20 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                                        placeholder="https://example.com/image.png"
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
                                        <span className={`text-sm font-bold uppercase tracking-widest ${textPrimary}`}>Active in Shop</span>
                                    </button>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-12 py-5 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
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
