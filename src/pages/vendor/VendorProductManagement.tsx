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
    List as ListIcon
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    stock_quantity: number;
    is_active: boolean;
    category_id: string;
    sku: string;
    images: string[];
    description?: string;
    created_at: string;
    category?: {
        name: string;
    };
}

interface Category {
    id: string;
    name: string;
}

export function VendorProductManagement() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
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
        sku: '',
        description: ''
    });

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

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [productsRes, categoriesRes, vendorRes] = await Promise.all([
                supabase
                    .from('products')
                    .select('*, category:categories(name)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('categories')
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
                sku: '',
                description: ''
            });
            setMessage({ type: 'success', text: 'Product added successfully!' });
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
                                                        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Product">
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
                                                <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
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
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Add New Product</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">List a new item in your store inventory</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                <XCircle className="w-6 h-6 text-gray-300" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Name *</label>
                                    <input
                                        required
                                        type="text"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        placeholder="e.g. Wireless Headphones"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SKU (Optional)</label>
                                    <input
                                        type="text"
                                        value={newProduct.sku}
                                        onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        placeholder="WH-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Price ($) *</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={newProduct.base_price}
                                        onChange={e => setNewProduct({ ...newProduct, base_price: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        placeholder="29.99"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Quantity *</label>
                                    <input
                                        required
                                        type="number"
                                        value={newProduct.stock_quantity}
                                        onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category *</label>
                                    <select
                                        required
                                        value={newProduct.category_id}
                                        onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-full space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Description</label>
                                    <textarea
                                        rows={4}
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                                        placeholder="Tell customers about your product..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving Product...
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
        </div>
    );
}
