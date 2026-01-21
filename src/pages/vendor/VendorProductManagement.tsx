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
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    }, []);

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

            const [productsRes, categoriesRes, brandsRes, vendorRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('*, category:categories(name)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('categories')
                    .select('id, name')
                    .eq('is_active', true),
                supabase
                    .from('brands')
                    .select('id, name')
                    .eq('is_active', true),
                supabase
                    .from('vendor_profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single()
            ]);

            if (vendorRes.data) {
                setVendorId(vendorRes.data.id);
                // Filter products by vendor if not already handled by RLS
                const vendorProducts = productsRes.data?.filter(p => p.vendor_id === vendorRes.data.id) || [];
                setProducts(vendorProducts);
            }

            setCategories(categoriesRes.data || []);
            setBrands(brandsRes.data || []);
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

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && product.is_active) ||
            (statusFilter === 'inactive' && !product.is_active);

        const matchesStock = stockFilter === 'all' ||
            (stockFilter === 'low' && product.stock_quantity > 0 && product.stock_quantity <= 10) ||
            (stockFilter === 'out' && product.stock_quantity === 0);

        const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;

        return matchesSearch && matchesStatus && matchesStock && matchesCategory;
    });

    const getStockStatus = (quantity: number) => {
        if (quantity === 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-100', icon: <XCircle className="w-3 h-3" /> };
        if (quantity <= 10) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <AlertTriangle className="w-3 h-3" /> };
        return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle className="w-3 h-3" /> };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-gray-500 text-sm font-medium">Loading your inventory...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage your shop inventory, stock levels and visibility.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4 rotate-90" />
                    </button>
                </div>
            )}

            {/* Filters & Search */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by product name, SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="pl-8 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value as any)}
                                className="pl-8 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Stock Levels</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative group">
                            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="pl-8 pr-10 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
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
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-gray-200" />
                                                </div>
                                                <p className="text-gray-400 text-sm font-medium">No products found matching your criteria</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const stock = getStockStatus(product.stock_quantity);
                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50/30 group transition-all">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm shrink-0">
                                                            {product.images?.[0] ? (
                                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Package className="w-6 h-6 text-gray-300" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-gray-900 leading-none group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{product.name}</h4>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">SKU: {product.sku || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                                        {product.category?.name || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-gray-900">${product.base_price.toFixed(2)}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-gray-900">{product.stock_quantity}</span>
                                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${stock.color}`}>
                                                                {stock.icon}
                                                                {stock.label}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 group-hover:opacity-100 opacity-50 transition-opacity">
                                                            <button
                                                                onClick={() => updateStock(product.id, product.stock_quantity - 1)}
                                                                className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                                                            >-</button>
                                                            <button
                                                                onClick={() => updateStock(product.id, product.stock_quantity + 1)}
                                                                className="w-6 h-6 border border-gray-200 rounded-md flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 transition-all"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${product.is_active
                                                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                            }`}
                                                    >
                                                        {product.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{product.is_active ? 'Active' : 'Inactive'}</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditProductClick(product)}
                                                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Edit Product"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                        <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-gray-100">
                            <Package className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">No products found</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => {
                            const stock = getStockStatus(product.stock_quantity);
                            return (
                                <div key={product.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                    <div className="h-48 relative overflow-hidden bg-gray-50">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-12 h-12 text-gray-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${stock.color} border-opacity-50`}>
                                                {stock.icon}
                                                {stock.label}
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md border-opacity-50 ${product.is_active ? 'bg-emerald-50/80 text-emerald-600 border-emerald-100' : 'bg-gray-100/80 text-gray-400 border-gray-200'}`}>
                                                {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {product.is_active ? 'Visible' : 'Hidden'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{product.category?.name || 'Uncategorized'}</p>
                                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1">{product.name}</h4>
                                            </div>
                                            <p className="text-lg font-black text-gray-900 leading-none">${product.base_price}</p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">STOCK: {product.stock_quantity}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEditProductClick(product)}
                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Low Stock Alert</p>
                            <p className="text-xs text-amber-700 font-medium">Some of your products are running low. Consider restocking soon to avoid lost sales.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStockFilter('low')}
                        className="text-xs font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest px-4 py-2 bg-white rounded-xl shadow-sm border border-amber-200 transition-all hover:shadow-md"
                    >
                        Review Items
                    </button>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Add New Product</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">List a new item in your store inventory</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                                <XCircle className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="flex flex-col overflow-hidden">
                            <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Name *</label>
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
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                            placeholder="e.g. Wireless Headphones"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">SKU (Auto-generated)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newProduct.sku}
                                                onChange={e => {
                                                    setNewProduct({ ...newProduct, sku: e.target.value });
                                                    setSkuManuallyEdited(true);
                                                }}
                                                className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono"
                                                placeholder="WH-001"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setNewProduct({ ...newProduct, sku: generateSKU(newProduct.name) });
                                                    setSkuManuallyEdited(false);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                title="Regenerate SKU"
                                            >
                                                <Plus className="w-3.5 h-3.5 rotate-45" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Base Price ($) *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={newProduct.base_price}
                                            onChange={e => setNewProduct({ ...newProduct, base_price: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                            placeholder="29.99"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Stock Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            value={newProduct.stock_quantity}
                                            onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                            placeholder="100"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Category *</label>
                                            <div className="relative group">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search category..."
                                                    className="pl-7 pr-3 py-1 bg-gray-100 border-none rounded-lg text-[10px] focus:ring-0 w-32 font-bold placeholder:text-gray-300 transition-all focus:w-48"
                                                    value={categorySearchTerm}
                                                    onChange={e => setCategorySearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <select
                                            required
                                            value={newProduct.category_id}
                                            onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
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
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Brand</label>
                                        <select
                                            value={newProduct.brand_id}
                                            onChange={e => setNewProduct({ ...newProduct, brand_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
                                        >
                                            <option value="">Select Brand (Optional)</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Description</label>
                                        <textarea
                                            rows={3}
                                            value={newProduct.description}
                                            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                                            placeholder="Tell customers about your product..."
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Colors (Hex codes)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(newProduct.attributes.colors || []).map((color: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:border-emerald-200 group">
                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: color }} />
                                                    <span className="text-[10px] font-bold text-gray-600 font-mono tracking-tighter">{color}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColor(color, 'add')}
                                                        className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: newColor }} />
                                                <input
                                                    type="text"
                                                    value={newColor}
                                                    onChange={e => setNewColor(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor('add'))}
                                                    placeholder="#FF5733"
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[12px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono"
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
                                    <div className="col-span-full py-2 border-t border-gray-50 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={newProduct.is_featured}
                                                    onChange={e => setNewProduct({ ...newProduct, is_featured: e.target.checked })}
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-all duration-300 ${newProduct.is_featured ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${newProduct.is_featured ? 'translate-x-5' : ''}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest block leading-none">Featured Product</span>
                                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Show this in featured products sections</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Images (up to 5)</label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {newProduct.images.map((img, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 shadow-sm">
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
                                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group">
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
                                                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                                            <span className="text-[8px] font-black text-gray-400 uppercase group-hover:text-emerald-500 transition-colors">Upload</span>
                                                            <span className="text-[7px] text-gray-300 font-bold uppercase mt-0.5">800x800px</span>
                                                        </>
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 bg-white text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[9px] border border-gray-200"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Edit Product</h3>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Update your product information</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all">
                                <XCircle className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProduct} className="flex flex-col overflow-hidden">
                            <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Name *</label>
                                        <input
                                            required
                                            type="text"
                                            value={editingProduct.name}
                                            onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">SKU</label>
                                        <input
                                            type="text"
                                            value={editingProduct.sku}
                                            onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Base Price ($) *</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={editingProduct.base_price}
                                            onChange={e => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Stock Quantity *</label>
                                        <input
                                            required
                                            type="number"
                                            value={editingProduct.stock_quantity}
                                            onChange={e => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Category *</label>
                                            <div className="relative group">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search category..."
                                                    className="pl-7 pr-3 py-1 bg-gray-100 border-none rounded-lg text-[10px] focus:ring-0 w-32 font-bold placeholder:text-gray-300 transition-all focus:w-48"
                                                    value={categorySearchTerm}
                                                    onChange={e => setCategorySearchTerm(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <select
                                            required
                                            value={editingProduct.category_id}
                                            onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
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
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Brand</label>
                                        <select
                                            value={editingProduct.brand_id}
                                            onChange={e => setEditingProduct({ ...editingProduct, brand_id: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer font-bold text-gray-700"
                                        >
                                            <option value="">Select Brand (Optional)</option>
                                            {brands.map(brand => (
                                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-full py-2 border-t border-gray-50 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={editingProduct.is_featured}
                                                    onChange={e => setEditingProduct({ ...editingProduct, is_featured: e.target.checked })}
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-all duration-300 ${editingProduct.is_featured ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-gray-200'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300 ${editingProduct.is_featured ? 'translate-x-5' : ''}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest block leading-none">Featured Product</span>
                                                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Show this in featured products sections</span>
                                            </div>
                                        </label>
                                    </div>
                                    <div className="col-span-full space-y-1.5">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Description</label>
                                        <textarea
                                            rows={3}
                                            value={editingProduct.description}
                                            onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-xl text-[13px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                                        />
                                    </div>
                                    <div className="col-span-full space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Colors (Hex codes)</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {(editingProduct.attributes?.colors || []).map((color: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:border-emerald-200 group">
                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: color }} />
                                                    <span className="text-[10px] font-bold text-gray-600 font-mono tracking-tighter">{color}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeColor(color, 'edit')}
                                                        className="p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                                                    >
                                                        <X className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: newColor }} />
                                                <input
                                                    type="text"
                                                    value={newColor}
                                                    onChange={e => setNewColor(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addColor('edit'))}
                                                    placeholder="#FF5733"
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-[12px] focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono"
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
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Product Images (up to 5)</label>
                                            <div className="flex gap-2">
                                                <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Recommended: 800x800px</span>
                                                <span className="text-[8px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">JPG, PNG, SVG, WEBP</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 gap-3">
                                            {(editingProduct.images || []).map((img: string, idx: number) => (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 shadow-sm bg-gray-50">
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
                                                <label className="relative aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group">
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
                                                            <Upload className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                                            <span className="text-[8px] font-black text-gray-400 uppercase group-hover:text-emerald-500 transition-colors">Upload</span>
                                                        </>
                                                    )}
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 bg-white text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[9px] border border-gray-200"
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
