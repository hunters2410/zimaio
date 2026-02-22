import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import {
    Package,
    Trash2,
    X,
    AlertCircle,
    Tag,
    Upload,
    Loader2
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
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState<any>({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        image_url: '',
        is_active: true,
        sort_order: 0,
    });

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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${activeTab}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('catalog')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('catalog')
                .getPublicUrl(filePath);

            setFormData({
                ...formData,
                [activeTab === 'categories' ? 'image_url' : 'logo_url']: publicUrl
            });
            setMessage({ type: 'success', text: 'Image uploaded successfully' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Error uploading image: ' + error.message });
        } finally {
            setUploading(false);
        }
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
                        <h1 className={`text-xl font-bold ${textPrimary} mb-1`}>Catalog Management</h1>
                        <p className={`text-sm ${textSecondary}`}>Manage product categories and brands to organize your marketplace.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className={`px-4 py-2 border ${borderColor} ${textPrimary} rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium`}
                    >
                        Add {activeTab === 'categories' ? 'Category' : 'Brand'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b ${borderColor}">
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === 'categories'
                        ? `${textPrimary} border-b-2 border-gray-900 dark:border-white`
                        : `${textSecondary} hover:${textPrimary}`
                        }`}
                >
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`px-4 py-2 font-medium text-sm transition-all ${activeTab === 'brands'
                        ? `${textPrimary} border-b-2 border-gray-900 dark:border-white`
                        : `${textSecondary} hover:${textPrimary}`
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
            {/* Content Table */}
            <div className="rounded border border-gray-200 overflow-hidden bg-white">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                                {activeTab === 'categories' ? 'Image' : 'Logo'}
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                                Name
                            </th>
                            {activeTab === 'categories' && (
                                <th className="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                                    Description
                                </th>
                            )}
                            <th className="px-3 py-2 text-xs font-medium text-gray-900 border-r border-gray-200">
                                Status
                            </th>
                            <th className="px-3 py-2 text-xs font-medium text-gray-900 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : activeTab === 'categories' ? (
                            categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 border-r border-gray-200 w-12">
                                        <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-200">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200">
                                        <div className="text-xs font-bold text-gray-900">{cat.name}</div>
                                        <div className="text-xs text-gray-500">{cat.slug}</div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200 max-w-xs truncate text-xs text-gray-600">
                                        {cat.description || '-'}
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                                            {cat.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="px-2 py-1 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded text-xs"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            brands.map((brand) => (
                                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 border-r border-gray-200 w-12">
                                        <div className="w-8 h-8 rounded bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-200">
                                            {brand.logo_url ? (
                                                <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Tag className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200">
                                        <div className="text-xs font-bold text-gray-900">{brand.name}</div>
                                        <div className="text-xs text-gray-500">{brand.slug}</div>
                                    </td>
                                    <td className="px-3 py-2 border-r border-gray-200">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-200 text-xs">
                                            {brand.is_active ? 'Active' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEdit(brand)}
                                                className="px-2 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(brand.id)}
                                                className="px-2 py-1 text-gray-600 border border-gray-200 hover:bg-gray-50 rounded text-xs"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded shadow-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">
                                    {editingItem ? 'Edit ' : 'New '}{activeTab === 'categories' ? 'Category' : 'Brand'}
                                </h2>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded transition">
                                <X className="h-4 w-4 text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Slug *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                        className={`w-full px-3 py-2 text-xs rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-900'}`}
                                    />
                                </div>
                                {activeTab === 'categories' && (
                                    <>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={2}
                                                className={`w-full px-3 py-2 text-xs rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-900'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-1`}>Sort Order</label>
                                            <input
                                                type="number"
                                                value={formData.sort_order}
                                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                                className={`w-full px-3 py-2 text-xs rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-900'}`}
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary}`}>
                                            {activeTab === 'categories' ? 'Category Image' : 'Brand Logo'}
                                        </label>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Recommended: {activeTab === 'categories' ? '800 x 800px (1:1)' : '400 x 200px (2:1)'}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {(formData.image_url || formData.logo_url) && (
                                            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-inner">
                                                <img
                                                    src={formData.image_url || formData.logo_url}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, [activeTab === 'categories' ? 'image_url' : 'logo_url']: '' })}
                                                    className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <label className={`flex-1 flex flex-col items-center justify-center h-24 border-2 border-dashed ${borderColor} rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative group`}>
                                                {uploading ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Loader2 className="w-6 h-6 text-slate-900 dark:text-white animate-spin" />
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Uploading...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Choose File</span>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleUpload}
                                                    disabled={uploading}
                                                    className="hidden"
                                                />
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={formData.image_url || formData.logo_url}
                                                    onChange={(e) => setFormData({ ...formData, [activeTab === 'categories' ? 'image_url' : 'logo_url']: e.target.value })}
                                                    className={`w-full px-3 py-2 text-xs rounded-lg border ${borderColor} focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white text-slate-900'}`}
                                                    placeholder="Or enter image URL"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${textPrimary}`}>Status Control</span>
                                        <span className={`text-[9px] font-medium ${textSecondary}`}>Enable or disable this items visibility</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className="flex items-center gap-3"
                                    >
                                        <div className={`w-12 h-7 bg-slate-200 dark:bg-slate-700 rounded-full relative transition-all duration-300 ${formData.is_active ? 'bg-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.4)]' : ''}`}>
                                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${formData.is_active ? 'translate-x-5' : ''}`} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {formData.is_active ? 'Active (Live)' : 'Deactivated'}
                                        </span>
                                    </button>
                                </div>

                                <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className={`px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] border ${borderColor} ${textSecondary} hover:bg-gray-50 dark:hover:bg-slate-700 transition-all`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
                                        disabled={loading || uploading}
                                    >
                                        {loading ? 'Saving...' : 'Save Catalog'}
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
