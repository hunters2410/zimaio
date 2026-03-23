import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
    Package,
    ChevronDown,
    CheckCircle,
    XCircle,
    LayoutGrid,
    List as ListIcon,
    Upload,
    Image,
    X,
} from 'lucide-react';
import { Pagination } from '../../components/Pagination';

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    stock_quantity: number;
    is_active: boolean;
    is_featured: boolean;
    category_id: string;
    brand_id?: string;
    sku: string;
    images: string[];
    description?: string;
    created_at: string;
    category?: {
        name: string;
    };
    brand?: {
        name: string;
    };
    attributes?: {
        colors?: string[];
    };
}

interface Brand {
    id: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

export function VendorProductManagement() {
    useEffect(() => {
        console.log('VendorProductManagement MOUNTED');
    }, []);

    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12;
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Package Limit State
    const [packageLimit, setPackageLimit] = useState<number | null>(null);
    const [currentProductCount, setCurrentProductCount] = useState(0);
    const isAtLimit = packageLimit !== null && currentProductCount >= packageLimit;

    // Add Product State
    const [vendorId, setVendorId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        base_price: '',
        stock_quantity: '',
        category_id: '',
        brand_id: '',
        is_featured: false,
        sku: '',
        description: '',
        images: [] as string[],
        attributes: { colors: [] as string[] }
    });
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [newColor, setNewColor] = useState('');

    useEffect(() => {
        fetchInitialData();
        if (searchParams.get('add') === 'true') {
            setShowAddModal(true);
            // Clean up the URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('add');
            setSearchParams(newParams);
        }
    }, [currentPage, searchQuery, statusFilter, stockFilter, categoryFilter]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!vendorId) {
            setMessage({ type: 'error', text: 'Error: Vendor profile not found. Please refresh the page.' });
            return;
        }

        setUploadingImage(true);
        try {
            const fileList = Array.from(files);

            for (const file of fileList) {
                // 1. Create a local preview URL
                const localUrl = URL.createObjectURL(file);

                // 2. Add local preview to state immediately for responsiveness
                if (isEditing) {
                    setEditingProduct((prev: any) => prev ? ({
                        ...prev,
                        images: [...(prev.images || []), localUrl].slice(0, 5)
                    }) : null);
                } else {
                    setNewProduct(prev => ({
                        ...prev,
                        images: [...(prev.images || []), localUrl].slice(0, 5)
                    }));
                }

                // 3. Upload the file
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('SUPABASE STORAGE ERROR:', uploadError);
                    console.error('Bucket: product-images, Path:', fileName);

                    // Remove the local preview if upload fails
                    if (isEditing) {
                        setEditingProduct((prev: any) => {
                            if (!prev) return null;
                            const newImages = (prev.images || []).filter((img: string) => img !== localUrl);
                            return { ...prev, images: newImages };
                        });
                    } else {
                        setNewProduct(prev => ({
                            ...prev,
                            images: (prev.images || []).filter(img => img !== localUrl)
                        }));
                    }

                    const errorDetails = uploadError.message || JSON.stringify(uploadError);
                    throw new Error(`Upload precision failed: ${errorDetails}`);
                }

                const { data } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                const publicUrl = data?.publicUrl;

                if (!publicUrl) {
                    throw new Error('Failed to generate public URL for uploaded image');
                }

                // 4. Replace local URL with actual public URL
                if (isEditing) {
                    setEditingProduct((prev: any) => prev ? ({
                        ...prev,
                        images: (prev.images || []).map((img: string) => img === localUrl ? publicUrl : img)
                    }) : null);
                } else {
                    setNewProduct(prev => ({
                        ...prev,
                        images: prev.images.map(img => img === localUrl ? publicUrl : img)
                    }));
                }

                // Success log
                console.log('Image uploaded successfully:', publicUrl);
            }
        } catch (error: any) {
            console.error('Final Image upload error:', error);
            setMessage({ type: 'error', text: error.message || 'Image upload failed' });
        } finally {
            setUploadingImage(false);
            // Reset input so the same file can be selected again if needed
            e.target.value = '';
        }
    };

    const removeImage = (index: number, isEditing: boolean) => {
        if (isEditing && editingProduct) {
            setEditingProduct({
                ...editingProduct,
                images: editingProduct.images.filter((_: string, i: number) => i !== index)
            });
        } else {
            setNewProduct({
                ...newProduct,
                images: newProduct.images.filter((_: string, i: number) => i !== index)
            });
        }
    };

    const generateSKU = (name: string) => {
        if (!name) return '';
        const prefix = name
            .split(' ')
            .map(word => word.substring(0, 3).toUpperCase())
            .join('-')
            .replace(/[^\w-]/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${random}`;
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: vendor } = await supabase
                .from('vendor_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (vendor) {
                setVendorId(vendor.id);

                // Fetch package limit and current count
                const [limitRes, countRes] = await Promise.all([
                    supabase
                        .rpc('get_vendor_package_limit', { vendor_user_id: user.id }),
                    supabase
                        .from('products')
                        .select('id', { count: 'exact', head: true })
                        .eq('vendor_id', vendor.id)
                ]);

                if (!limitRes.error) setPackageLimit(limitRes.data);
                if (!countRes.error) setCurrentProductCount(countRes.count || 0);

                let query = supabase
                    .from('products')
                    .select('*, category:categories(name)', { count: 'exact' })
                    .eq('vendor_id', vendor.id);

                if (statusFilter !== 'all') {
                    query = query.eq('is_active', statusFilter === 'active');
                }

                if (categoryFilter !== 'all') {
                    query = query.eq('category_id', categoryFilter);
                }

                if (stockFilter === 'low') {
                    query = query.gt('stock_quantity', 0).lte('stock_quantity', 10);
                } else if (stockFilter === 'out') {
                    query = query.eq('stock_quantity', 0);
                }

                if (searchQuery) {
                    query = query.ilike('name', `%${searchQuery}%`);
                }

                const [productsRes, categoriesRes, brandsRes] = await Promise.all([
                    query
                        .order('created_at', { ascending: false })
                        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1),
                    supabase
                        .from('categories')
                        .select('id, name')
                        .eq('is_active', true),
                    supabase
                        .from('brands')
                        .select('id, name')
                        .eq('is_active', true)
                ]);

                setProducts(productsRes.data || []);
                setTotalItems(productsRes.count || 0);
                setCategories(categoriesRes.data || []);
                setBrands(brandsRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId) return;

        setSaving(true);
        try {
            const slug = newProduct.name
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');

            const { data, error } = await supabase
                .from('products')
                .insert([{
                    ...newProduct,
                    base_price: parseFloat(newProduct.base_price),
                    stock_quantity: parseInt(newProduct.stock_quantity),
                    vendor_id: vendorId,
                    brand_id: newProduct.brand_id || null,
                    is_featured: newProduct.is_featured,
                    slug,
                    is_active: true
                }])
                .select('*, category:categories(name)')
                .single();

            if (error) throw error;

            setProducts(prev => [data, ...prev]);
            setCurrentProductCount(prev => prev + 1);
            setShowAddModal(false);
            setNewProduct({
                name: '',
                base_price: '',
                stock_quantity: '',
                category_id: '',
                brand_id: '',
                is_featured: false,
                sku: '',
                description: '',
                images: [],
                attributes: { colors: [] }
            });
            setSkuManuallyEdited(false);
            setMessage({ type: 'success', text: 'Product added successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;

        setSaving(true);
        try {
            const slug = editingProduct.name
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-');

            const { data, error } = await supabase
                .from('products')
                .update({
                    name: editingProduct.name,
                    base_price: parseFloat(editingProduct.base_price),
                    stock_quantity: parseInt(editingProduct.stock_quantity),
                    category_id: editingProduct.category_id,
                    brand_id: editingProduct.brand_id || null,
                    is_featured: editingProduct.is_featured,
                    sku: editingProduct.sku,
                    slug,
                    description: editingProduct.description,
                    images: editingProduct.images,
                    attributes: editingProduct.attributes || { colors: [] }
                })
                .eq('id', editingProduct.id)
                .select('*, category:categories(name)')
                .single();

            if (error) throw error;

            setProducts(prev => prev.map(p => p.id === data.id ? data : p));
            setShowEditModal(false);
            setEditingProduct(null);
            setMessage({ type: 'success', text: 'Product updated successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({ is_active: !currentStatus })
                .eq('id', productId);

            if (error) throw error;

            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, is_active: !currentStatus } : p
            ));
            setMessage({ type: 'success', text: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully.` });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const updateStock = async (productId: string, newQuantity: number) => {
        try {
            if (newQuantity < 0) return;

            const { error } = await supabase
                .from('products')
                .update({ stock_quantity: newQuantity })
                .eq('id', productId);

            if (error) throw error;

            setProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, stock_quantity: newQuantity } : p
            ));
            setMessage({ type: 'success', text: 'Stock updated successfully.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            setProducts(prev => prev.filter(p => p.id !== productId));
            setCurrentProductCount(prev => Math.max(0, prev - 1));
            setMessage({ type: 'success', text: 'Product deleted successfully.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const addColor = (type: 'add' | 'edit') => {
        if (!newColor || !newColor.startsWith('#')) return;
        if (type === 'add') {
            const colors = newProduct.attributes?.colors || [];
            if (!colors.includes(newColor)) {
                setNewProduct({
                    ...newProduct,
                    attributes: { ...newProduct.attributes, colors: [...colors, newColor] }
                });
            }
        } else {
            const colors = editingProduct.attributes?.colors || [];
            if (!colors.includes(newColor)) {
                setEditingProduct({
                    ...editingProduct,
                    attributes: { ...editingProduct.attributes, colors: [...colors, newColor] }
                });
            }
        }
        setNewColor('');
    };

    const removeColor = (color: string, type: 'add' | 'edit') => {
        if (type === 'add') {
            const colors = newProduct.attributes?.colors || [];
            setNewProduct({
                ...newProduct,
                attributes: { ...newProduct.attributes, colors: colors.filter((c: string) => c !== color) }
            });
        } else {
            const colors = editingProduct.attributes?.colors || [];
            setEditingProduct({
                ...editingProduct,
                attributes: { ...editingProduct.attributes, colors: colors.filter((c: string) => c !== color) }
            });
        }
    };

    const handleEditProductClick = (product: Product) => {
        setEditingProduct({
            ...product,
            images: Array.isArray(product.images) ? product.images : [],
            base_price: product.base_price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            brand_id: product.brand_id || '',
            is_featured: product.is_featured || false,
            attributes: product.attributes || { colors: [] }
        });
        setShowEditModal(true);
    };

    const filteredProducts = products; // Now handled server-side

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50', icon: <XCircle className="w-3 h-3" /> };
        if (quantity <= 10) return { label: 'Low Stock', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50', icon: <AlertTriangle className="w-3 h-3" /> };
        return { label: 'In Stock', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50', icon: <CheckCircle className="w-3 h-3" /> };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Loading your inventory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Product Management</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Manage your shop inventory, stock levels and visibility.</p>
                        {packageLimit !== null && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isAtLimit ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'}`}>
                                Usage: {currentProductCount} / {packageLimit} Products
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex shadow-sm">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={isAtLimit}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${isAtLimit
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'}`}
                    >
                        <Plus className="w-4 h-4" />
                        {isAtLimit ? 'Limit Reached' : 'Add Product'}
                    </button>
                    {isAtLimit && (
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-800/50">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Upgrade to add more
                        </div>
                    )}
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <MoreVertical className="w-4 h-4 rotate-90" />
                    </button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="pl-8 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value as any)}
                                className="pl-8 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Stock Levels</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="pl-8 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>

                        {(searchQuery || statusFilter !== 'all' || stockFilter !== 'all' || categoryFilter !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setStockFilter('all');
                                    setCategoryFilter('all');
                                }}
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest px-2"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Product List */}
            {viewMode === 'table' ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden text-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Price</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Stock</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                    <th className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                                                </div>
                                                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">No products found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const stock = getStockStatus(product.stock_quantity);
                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-700/30 group transition-all">
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden shadow-sm shrink-0">
                                                            {product.images?.[0] ? (
                                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-none group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-tight line-clamp-1">{product.name}</h4>
                                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-tighter">SKU: {product.sku || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-widest truncate max-w-[100px] inline-block">
                                                        {product.category?.name || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">${product.base_price.toFixed(2)}</span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{product.stock_quantity}</span>
                                                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${stock.color}`}>
                                                                {stock.icon}
                                                                {stock.label}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 group-hover:opacity-100 opacity-50 transition-opacity">
                                                            <button
                                                                onClick={() => updateStock(product.id, product.stock_quantity - 1)}
                                                                className="w-5 h-5 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all text-xs"
                                                            >-</button>
                                                            <button
                                                                onClick={() => updateStock(product.id, product.stock_quantity + 1)}
                                                                className="w-5 h-5 border border-slate-200 dark:border-slate-700 rounded flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-xs"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <button
                                                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${product.is_active
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                            }`}
                                                    >
                                                        {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{product.is_active ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleEditProductClick(product)}
                                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                            title="Edit Product"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.length === 0 ? (
                        <div className="col-span-full py-20 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                                <Package className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">No Items Found</h3>
                                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">Try adjusting your filters or search query</p>
                            </div>
                        </div>
                    ) : (
                        filteredProducts.map((product) => {
                            const stock = getStockStatus(product.stock_quantity);
                            return (
                                <div key={product.id} className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-900/20 transition-all duration-300">
                                    <div className="h-48 relative overflow-hidden bg-slate-50 dark:bg-slate-900">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${stock.color} border-opacity-50`}>
                                                {stock.icon}
                                                {stock.label}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md border-opacity-50 ${product.is_active
                                                ? 'bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50'
                                                : 'bg-slate-100/80 dark:bg-slate-700/80 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
                                                }`}>
                                                {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {product.is_active ? 'Visible' : 'Hidden'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{product.category?.name || 'Uncategorized'}</p>
                                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{product.name}</h4>
                                            </div>
                                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none tabular-nums">${product.base_price}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50 dark:border-slate-700/50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">STOCK: {product.stock_quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditProductClick(product)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Low Stock Warning Banner */}
            {products.some(p => p.stock_quantity > 0 && p.stock_quantity <= 10) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800/40 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight">Low Stock Alert</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Some of your products are running low. Consider restocking soon to avoid lost sales.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStockFilter('low')}
                        className="text-xs font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 uppercase tracking-widest px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800 transition-all hover:shadow-md"
                    >
                        Review Items
                    </button>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Add New Product</h3>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">List a new item in your store inventory</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                                <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="flex flex-col overflow-hidden">
                            <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={newProduct.name}
                                            onChange={e => {
                                                const name = e.target.value;
                                                setNewProduct(prev => ({
                                                    ...prev,
                                                    name,
                                                    sku: skuManuallyEdited ? prev.sku : generateSKU(name)
                                                }));
                                            }}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="e.g. Wireless Headphones"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">SKU (Auto-generated)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newProduct.sku}
                                                onChange={e => {
                                                    setNewProduct({ ...newProduct, sku: e.target.value });
                                                    setSkuManuallyEdited(true);
                                                }}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-roboto placeholder:text-slate-400"
                                                placeholder="WH-001"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProduct({ ...newProduct, sku: generateSKU(newProduct.name) });
                                                    setSkuManuallyEdited(false);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                title="Regenerate SKU"
                                            >
                                                <Plus className="w-3.5 h-3.5 rotate-45" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Base Price ($) *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={newProduct.base_price}
                                            onChange={e => setNewProduct({ ...newProduct, base_price: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="29.99"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Stock Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            value={newProduct.stock_quantity}
                                            onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Category *</label>
                                            <div className="relative group">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Search category..."
                                                    className="pl-7 pr-3 py-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-[10px] focus:ring-0 w-32 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all focus:w-48"
                                                    value={categorySearchTerm}
                                                    onChange={e => setCategorySearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <select
                                            required
                                            value={newProduct.category_id}
                                            onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="">Select Category</option>
                                            {categories
                                                .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Brand</label>
                                        <select
                                            value={newProduct.brand_id}
                                            onChange={e => setNewProduct({ ...newProduct, brand_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="">Select Brand (Optional)</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Description</label>
                                        <textarea
                                            rows={3}
                                            value={newProduct.description}
                                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-slate-400"
                                            placeholder="Tell customers about your product..."
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Colors (Hex codes)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(newProduct.attributes.colors || []).map((color: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:border-emerald-200 group">
                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: color }} />
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-roboto tracking-tighter">{color}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColor(color, 'add')}
                                                        className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: newColor }} />
                                                <input
                                                    type="text"
                                                    value={newColor}
                                                    onChange={e => setNewColor(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor('add'))}
                                                    placeholder="#FF5733"
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[12px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-roboto placeholder:text-slate-400"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => addColor('add')}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-full py-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={newProduct.is_featured}
                                                    onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-all duration-300 ${newProduct.is_featured ? 'bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${newProduct.is_featured ? 'translate-x-5' : ''}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest block leading-none">Featured Product</span>
                                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Show this in featured products sections</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Images (up to 5)</label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {newProduct.images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx, false)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {newProduct.images.length < 5 && (
                                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group">
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.svg,.webp,.gif"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(e, false)}
                                                        disabled={uploadingImage}
                                                    />
                                                    {uploadingImage ? (
                                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
                                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase group-hover:text-emerald-500 transition-colors">Upload</span>
                                                            <span className="text-[7px] text-slate-300 dark:text-slate-600 font-bold uppercase mt-0.5">800x800px</span>
                                                        </>
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[9px] border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploadingImage}
                                    className="flex-[2] px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : uploadingImage ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading Images...
                                        </>
                                    ) : (
                                        'Create Product'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Product Modal */}
            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Product</h3>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Update your product information</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all">
                                <XCircle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="flex flex-col overflow-hidden">
                            <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingProduct.name}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">SKU</label>
                                        <input
                                            type="text"
                                            value={editingProduct.sku}
                                            onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-roboto placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Base Price ($) *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={editingProduct.base_price}
                                            onChange={e => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Stock Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            value={editingProduct.stock_quantity}
                                            onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Category *</label>
                                            <div className="relative group">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Search category..."
                                                    className="pl-7 pr-3 py-1 bg-slate-100 dark:bg-slate-900 border-none rounded-lg text-[10px] focus:ring-0 w-32 font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all focus:w-48"
                                                    value={categorySearchTerm}
                                                    onChange={e => setCategorySearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <select
                                            required
                                            value={editingProduct.category_id}
                                            onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="">Select Category</option>
                                            {categories
                                                .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Brand</label>
                                        <select
                                            value={editingProduct.brand_id}
                                            onChange={e => setEditingProduct({ ...editingProduct, brand_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold"
                                        >
                                            <option value="">Select Brand (Optional)</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full py-2 border-t border-slate-50 dark:border-slate-700 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={editingProduct.is_featured}
                                                    onChange={e => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-all duration-300 ${editingProduct.is_featured ? 'bg-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${editingProduct.is_featured ? 'translate-x-5' : ''}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest block leading-none">Featured Product</span>
                                                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Show this in featured products sections</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Description</label>
                                        <textarea
                                            rows={3}
                                            value={editingProduct.description}
                                            onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[13px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none placeholder:text-slate-400"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Colors (Hex codes)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editingProduct.attributes?.colors || []).map((color: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:border-emerald-200 group">
                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: color }} />
                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 font-roboto tracking-tighter">{color}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColor(color, 'edit')}
                                                        className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-slate-200 dark:border-slate-700" style={{ backgroundColor: newColor }} />
                                                <input
                                                    type="text"
                                                    value={newColor}
                                                    onChange={e => setNewColor(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor('edit'))}
                                                    placeholder="#FF5733"
                                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-transparent dark:border-slate-700 rounded-xl text-[12px] text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-roboto placeholder:text-slate-400"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => addColor('edit')}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Product Images (up to 5)</label>
                                            <div className="flex gap-2">
                                                <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Recommended: 800x800px</span>
                                                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">JPG, PNG, SVG, WEBP</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 gap-3">
                                            {(editingProduct.images || []).map((img: string, idx: number) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 dark:border-slate-700 shadow-sm bg-slate-50 dark:bg-slate-900/50">
                                                    <img
                                                        src={img}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=Image+Load+Error';
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx, true)}
                                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            {(editingProduct.images || []).length < 5 && (
                                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-all group">
                                                    <input
                                                        type="file"
                                                        accept=".jpg,.jpeg,.png,.svg,.webp,.gif"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(e, true)}
                                                        disabled={uploadingImage}
                                                    />
                                                    {uploadingImage ? (
                                                        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors" />
                                                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase group-hover:text-emerald-500 transition-colors">Upload</span>
                                                        </>
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase tracking-widest text-[9px] border border-slate-200 dark:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploadingImage}
                                    className="flex-[2] px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[9px] shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Updating...
                                        </>
                                    ) : uploadingImage ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Uploading Images...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
