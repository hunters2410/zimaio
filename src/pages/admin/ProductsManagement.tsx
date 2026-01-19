import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Package, Filter, Edit, Trash2, CheckCircle, XCircle, Power, PowerOff, AlertCircle, X, Save, Grid3x3, List } from 'lucide-react';
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
      setMessage({ type: 'success', text: 'Product updated' });
      setEditingProduct(null);
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
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-cyan-600" />
            <div>
              <h1 className={`text-2xl font-bold ${textPrimary}`}>Product Management</h1>
              <p className={`text-sm ${textSecondary}`}>Manage all vendor products</p>
            </div>
          </div>
          <div className={`flex items-center border ${borderColor} rounded-lg p-1`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${
                viewMode === 'grid'
                  ? 'bg-cyan-600 text-white'
                  : `${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition ${
                viewMode === 'list'
                  ? 'bg-cyan-600 text-white'
                  : `${textSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${
            message.type === 'success'
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Total Products</p>
          <p className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Approved</p>
          <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
        </div>
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4`}>
          <p className={`text-xs ${textSecondary} mb-1`}>Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-cyan-600" />
          <span className={`text-sm font-medium ${textPrimary}`}>Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Vendor</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            >
              <option value="all">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>{vendor.shop_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Approval</label>
            <select
              value={filterApproval}
              onChange={(e) => setFilterApproval(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>From Date</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>To Date</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${textPrimary} mb-1`}>Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, SKU..."
              className={`w-full px-2 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={resetFilters}
            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${borderColor}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Product</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Vendor</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Price</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Stock</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Approval</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${textSecondary}`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <p className={`text-sm ${textSecondary}`}>No products found</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className={`text-xs ${textSecondary}`}>{product.sku}</p>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm ${textSecondary}`}>
                        {product.vendor?.shop_name || 'Unknown'}
                      </td>
                      <td className={`px-4 py-3 text-sm font-semibold ${textPrimary}`}>
                        ${product.base_price.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-sm ${textPrimary}`}>
                        {product.stock_quantity}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {product.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {product.admin_approved ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 font-medium">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition dark:hover:bg-blue-900/30"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(product)}
                            className={`p-1 rounded transition ${
                              product.is_active
                                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                            }`}
                            title={product.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {product.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition ${
                    product.is_active
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full my-8`}>
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-lg font-bold ${textPrimary}`}>Edit Product</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Description</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.base_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_price: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: parseInt(e.target.value) })}
                    className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                      isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${textPrimary}`}>Featured Product</label>
                <button
                  onClick={() => setEditingProduct({ ...editingProduct, is_featured: !editingProduct.is_featured })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    editingProduct.is_featured ? 'bg-cyan-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      editingProduct.is_featured ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className={`block text-xs font-medium ${textPrimary} mb-1.5`}>Admin Notes</label>
                <textarea
                  value={editingProduct.admin_notes || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, admin_notes: e.target.value })}
                  rows={2}
                  placeholder="Internal notes about this product..."
                  className={`w-full px-3 py-1.5 text-sm border ${borderColor} rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                {!editingProduct.admin_approved && (
                  <>
                    <button
                      onClick={() => handleApproveReject(editingProduct.id, true, editingProduct.admin_notes || undefined)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveReject(editingProduct.id, false, editingProduct.admin_notes || 'Product rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={handleSaveProduct}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded hover:from-cyan-700 hover:to-green-700 transition"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
