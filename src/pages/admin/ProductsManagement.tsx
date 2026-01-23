import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Filter, Edit, Power, PowerOff, AlertCircle, X, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
  is_featured: boolean;
  admin_approved: boolean;
  admin_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  vendor_id: string;
  vendor?: {
    shop_name: string;
    user_id: string;
  };
}

type ViewMode = 'grid' | 'list';

export function ProductsManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [vendors, setVendors] = useState<{ id: string; shop_name: string }[]>([]);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filterVendor, filterStatus, filterApproval, filterDateFrom, filterDateTo, searchQuery]);

  const fetchData = async () => {
    try {
      const [productsRes, vendorsRes] = await Promise.all([
        supabase
          .from('products')
          .select(`
            *,
            vendor:vendor_profiles(shop_name, user_id)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('vendor_profiles')
          .select('id, shop_name')
          .order('shop_name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (vendorsRes.error) throw vendorsRes.error;

      setProducts(productsRes.data || []);
      setVendors(vendorsRes.data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filterVendor !== 'all') {
      filtered = filtered.filter(p => p.vendor_id === filterVendor);
    }

    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter(p => p.is_active === isActive);
    }

    if (filterApproval !== 'all') {
      const isApproved = filterApproval === 'approved';
      filtered = filtered.filter(p => p.admin_approved === isApproved);
    }

    if (filterDateFrom) {
      filtered = filtered.filter(p => new Date(p.created_at) >= new Date(filterDateFrom));
    }
    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(p => new Date(p.created_at) <= toDate);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setFilterVendor('all');
    setFilterStatus('all');
    setFilterApproval('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) throw error;
      setMessage({ type: 'success', text: `Product ${product.is_active ? 'deactivated' : 'activated'}` });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleApproveReject = async (productId: string, approved: boolean, notes?: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          admin_approved: approved,
          admin_notes: notes || null,
          rejection_reason: approved ? null : notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;
      setMessage({ type: 'success', text: `Product ${approved ? 'approved' : 'rejected'}` });
      setEditingProduct(null);
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Product deleted' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          base_price: editingProduct.base_price,
          stock_quantity: editingProduct.stock_quantity,
          is_featured: editingProduct.is_featured,
          admin_notes: editingProduct.admin_notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Product updated successfully' });
      // setEditingProduct(null); // Keep modal open
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const stats = {
    total: filteredProducts.length,
    active: filteredProducts.filter(p => p.is_active).length,
    approved: filteredProducts.filter(p => p.admin_approved).length,
    pending: filteredProducts.filter(p => !p.admin_approved).length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${textPrimary} mb-1`}>Products Management</h1>
            <p className={`text-sm ${textSecondary}`}>Manage all vendor products</p>
          </div>
          <div className={`flex items-center border ${borderColor} rounded p-0.5 bg-white dark:bg-gray-900`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 rounded text-xs transition ${viewMode === 'grid'
                ? `${textPrimary} bg-gray-100 dark:bg-gray-700`
                : `${textSecondary} hover:bg-gray-50 dark:hover:bg-gray-700`
                }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 rounded text-xs transition ${viewMode === 'list'
                ? `${textPrimary} bg-gray-100 dark:bg-gray-700`
                : `${textSecondary} hover:bg-gray-50 dark:hover:bg-gray-700`
                }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-600 mb-1">Total</p>
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-600 mb-1">Active</p>
          <p className="text-lg font-bold text-gray-900">{stats.active}</p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-600 mb-1">Approved</p>
          <p className="text-lg font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-3">
          <p className="text-xs text-gray-600 mb-1">Pending</p>
          <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3 w-3 text-gray-400" />
          <span className="text-xs font-bold text-gray-900">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Vendor</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            >
              <option value="all">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.shop_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Approval</label>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">To</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-0.5">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name..."
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            onClick={resetFilters}
            className="text-xs text-gray-600 hover:text-gray-900 font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Product</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Vendor</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Price</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Stock</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Status</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 border-r border-slate-200">Approval</th>
                  <th className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <p className={`text-sm ${textSecondary}`}>No products found</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors bg-white">
                      <td className="px-3 py-2 border-r border-gray-200 text-xs">
                        <div>
                          <p className="font-bold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.sku}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200 text-xs text-gray-600">
                        {product.vendor?.shop_name || 'Unknown'}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200 text-xs font-bold text-gray-900">
                        ${product.base_price.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200 text-xs text-gray-900">
                        {product.stock_quantity}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200">
                        {product.is_active ? (
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 text-xs">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 text-xs">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 border-r border-gray-200">
                        {product.admin_approved ? (
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 text-xs">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 px-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded text-xs"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(product)}
                            className="p-1 px-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded text-xs"
                          >
                            {product.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${textPrimary} mb-1`}>{product.name}</h3>
                  <p className={`text-xs ${textSecondary}`}>{product.vendor?.shop_name}</p>
                </div>
                <div className="flex gap-1">
                  {product.is_active ? (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className={textSecondary}>Price:</span>
                  <span className={`font-semibold ${textPrimary}`}>${product.base_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={textSecondary}>Stock:</span>
                  <span className={textPrimary}>{product.stock_quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={textSecondary}>Approval:</span>
                  {product.admin_approved ? (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Approved
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition dark:bg-blue-900/30 dark:text-blue-400"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition ${product.is_active
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                >
                  {product.is_active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  {product.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded shadow-lg max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900">Edit Product</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 hover:bg-gray-100 rounded transition">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.base_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Admin Notes</label>
                <textarea
                  value={editingProduct.admin_notes || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, admin_notes: e.target.value })}
                  rows={2}
                  placeholder="Notes..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none bg-white text-gray-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                {!editingProduct.admin_approved && (
                  <>
                    <button
                      onClick={() => handleApproveReject(editingProduct.id, true, editingProduct.admin_notes || undefined)}
                      className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(editingProduct.id, false, editingProduct.admin_notes || 'Product rejected')}
                      className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
