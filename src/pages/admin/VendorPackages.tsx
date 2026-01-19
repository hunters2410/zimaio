import { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { AdminLayout } from '../../components/AdminLayout';

interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  product_limit: number;
  has_catalog_management: boolean;
  has_stock_management: boolean;
  has_pos_access: boolean;
  has_orders_management: boolean;
  has_wallet_management: boolean;
  has_shipping_management: boolean;
  has_withdraw_management: boolean;
  has_shop_configurations: boolean;
  has_reports_management: boolean;
  has_customer_support: boolean;
  has_notifications: boolean;
  has_refund_management: boolean;
  has_kyc_verification: boolean;
  has_ads_access: boolean;
  has_promotion_access: boolean;
  has_analytics_access: boolean;
  has_priority_support: boolean;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export default function VendorPackages() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<VendorPackage | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    product_limit: 10,
    has_catalog_management: false,
    has_stock_management: false,
    has_pos_access: false,
    has_orders_management: false,
    has_wallet_management: false,
    has_shipping_management: false,
    has_withdraw_management: false,
    has_shop_configurations: false,
    has_reports_management: false,
    has_customer_support: false,
    has_notifications: false,
    has_refund_management: false,
    has_kyc_verification: false,
    has_ads_access: false,
    has_promotion_access: false,
    has_analytics_access: false,
    has_priority_support: false,
    is_active: true,
    is_default: false,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setMessage({ type: 'error', text: 'Failed to load packages' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('vendor_packages')
          .update(formData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Package updated successfully' });
      } else {
        const { error } = await supabase
          .from('vendor_packages')
          .insert([formData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Package created successfully' });
      }

      await fetchPackages();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving package:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save package' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: VendorPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price_monthly: pkg.price_monthly,
      price_yearly: pkg.price_yearly,
      product_limit: pkg.product_limit,
      has_catalog_management: pkg.has_catalog_management,
      has_stock_management: pkg.has_stock_management,
      has_pos_access: pkg.has_pos_access,
      has_orders_management: pkg.has_orders_management,
      has_wallet_management: pkg.has_wallet_management,
      has_shipping_management: pkg.has_shipping_management,
      has_withdraw_management: pkg.has_withdraw_management,
      has_shop_configurations: pkg.has_shop_configurations,
      has_reports_management: pkg.has_reports_management,
      has_customer_support: pkg.has_customer_support,
      has_notifications: pkg.has_notifications,
      has_refund_management: pkg.has_refund_management,
      has_kyc_verification: pkg.has_kyc_verification,
      has_ads_access: pkg.has_ads_access,
      has_promotion_access: pkg.has_promotion_access,
      has_analytics_access: pkg.has_analytics_access,
      has_priority_support: pkg.has_priority_support,
      is_active: pkg.is_active,
      is_default: pkg.is_default,
      sort_order: pkg.sort_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package? Vendors using this package will be affected.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendor_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Package deleted successfully' });
      await fetchPackages();
    } catch (error: any) {
      console.error('Error deleting package:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete package' });
    }
  };

  const toggleActive = async (pkg: VendorPackage) => {
    try {
      const { error } = await supabase
        .from('vendor_packages')
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id);

      if (error) throw error;
      setMessage({ type: 'success', text: `Package ${!pkg.is_active ? 'activated' : 'deactivated'} successfully` });
      await fetchPackages();
    } catch (error: any) {
      console.error('Error toggling package status:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update package status' });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      product_limit: 10,
      has_catalog_management: false,
      has_stock_management: false,
      has_pos_access: false,
      has_orders_management: false,
      has_wallet_management: false,
      has_shipping_management: false,
      has_withdraw_management: false,
      has_shop_configurations: false,
      has_reports_management: false,
      has_customer_support: false,
      has_notifications: false,
      has_refund_management: false,
      has_kyc_verification: false,
      has_ads_access: false,
      has_promotion_access: false,
      has_analytics_access: false,
      has_priority_support: false,
      is_active: true,
      is_default: false,
      sort_order: 0,
    });
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  if (loading && packages.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
            <p className={`mt-4 ${textSecondary}`}>Loading packages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Package className={`h-8 w-8 ${textPrimary}`} />
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Vendor Packages</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Add Package</span>
          </button>
        </div>
        <p className={textSecondary}>
          Manage subscription packages for vendors with customizable features and pricing
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`${cardBg} border ${borderColor} rounded-lg p-6 relative ${
              !pkg.is_active ? 'opacity-60' : ''
            }`}
          >
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => handleEdit(pkg)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                title="Edit Package"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                title="Delete Package"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className={`text-xl font-bold ${textPrimary}`}>{pkg.name}</h3>
                {pkg.is_default && (
                  <span className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <p className={`text-sm ${textSecondary}`}>{pkg.description}</p>
            </div>

            <div className="mb-4">
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-bold ${textPrimary}`}>
                  ${pkg.price_monthly}
                </span>
                <span className={textSecondary}>/month</span>
              </div>
              {pkg.price_yearly > 0 && (
                <div className={`text-sm ${textSecondary} mt-1`}>
                  ${pkg.price_yearly}/year (save ${((pkg.price_monthly * 12) - pkg.price_yearly).toFixed(2)})
                </div>
              )}
            </div>

            <div className={`border-t ${borderColor} pt-4 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Products</span>
                <span className={`text-sm font-semibold ${textPrimary}`}>
                  {pkg.product_limit === 999999 ? 'Unlimited' : pkg.product_limit}
                </span>
              </div>

              <div className={`text-xs font-semibold ${textPrimary} pt-2`}>Core Features</div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Catalog Management</span>
                {pkg.has_catalog_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Stock Management</span>
                {pkg.has_stock_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Orders Management</span>
                {pkg.has_orders_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Shop Configurations</span>
                {pkg.has_shop_configurations ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Notifications</span>
                {pkg.has_notifications ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>

              <div className={`text-xs font-semibold ${textPrimary} pt-2`}>Advanced Features</div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>POS Access</span>
                {pkg.has_pos_access ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Wallet Management</span>
                {pkg.has_wallet_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Shipping Management</span>
                {pkg.has_shipping_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Withdraw Management</span>
                {pkg.has_withdraw_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Reports Management</span>
                {pkg.has_reports_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Customer Support</span>
                {pkg.has_customer_support ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Refund Management</span>
                {pkg.has_refund_management ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>KYC Verification</span>
                {pkg.has_kyc_verification ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>

              <div className={`text-xs font-semibold ${textPrimary} pt-2`}>Marketing Features</div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Ads Access</span>
                {pkg.has_ads_access ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Promotions</span>
                {pkg.has_promotion_access ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Analytics</span>
                {pkg.has_analytics_access ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Priority Support</span>
                {pkg.has_priority_support ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleActive(pkg)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                  pkg.is_active
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pkg.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h2>
              <button
                onClick={handleCloseModal}
                className={`${textSecondary} hover:text-gray-600 transition`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                    placeholder="e.g., Free, Basic, Pro"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  placeholder="Brief description of the package"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Monthly Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Yearly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Product Limit *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.product_limit}
                    onChange={(e) => setFormData({ ...formData, product_limit: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                    placeholder="999999 for unlimited"
                  />
                </div>
              </div>

              <div className={`p-4 border ${borderColor} rounded-lg mb-4`}>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>Core Vendor Features</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_catalog_management}
                      onChange={(e) => setFormData({ ...formData, has_catalog_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Catalog Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_stock_management}
                      onChange={(e) => setFormData({ ...formData, has_stock_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Stock Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_orders_management}
                      onChange={(e) => setFormData({ ...formData, has_orders_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Orders Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_shop_configurations}
                      onChange={(e) => setFormData({ ...formData, has_shop_configurations: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Shop Configurations</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_notifications}
                      onChange={(e) => setFormData({ ...formData, has_notifications: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Notifications</span>
                  </label>
                </div>

                <h3 className={`text-sm font-semibold ${textPrimary} mb-3 mt-4`}>Advanced Features</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_pos_access}
                      onChange={(e) => setFormData({ ...formData, has_pos_access: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>POS Access</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_wallet_management}
                      onChange={(e) => setFormData({ ...formData, has_wallet_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Wallet Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_shipping_management}
                      onChange={(e) => setFormData({ ...formData, has_shipping_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Shipping Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_withdraw_management}
                      onChange={(e) => setFormData({ ...formData, has_withdraw_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Withdraw Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_reports_management}
                      onChange={(e) => setFormData({ ...formData, has_reports_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Reports Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_customer_support}
                      onChange={(e) => setFormData({ ...formData, has_customer_support: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Customer Support</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_refund_management}
                      onChange={(e) => setFormData({ ...formData, has_refund_management: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Refund Management</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_kyc_verification}
                      onChange={(e) => setFormData({ ...formData, has_kyc_verification: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>KYC Verification</span>
                  </label>
                </div>

                <h3 className={`text-sm font-semibold ${textPrimary} mb-3 mt-4`}>Marketing Features</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_ads_access}
                      onChange={(e) => setFormData({ ...formData, has_ads_access: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Ads Access</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_promotion_access}
                      onChange={(e) => setFormData({ ...formData, has_promotion_access: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Promotion Access</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_analytics_access}
                      onChange={(e) => setFormData({ ...formData, has_analytics_access: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Analytics Access</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_priority_support}
                      onChange={(e) => setFormData({ ...formData, has_priority_support: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Priority Support</span>
                  </label>
                </div>
              </div>

              <div className={`p-4 border ${borderColor} rounded-lg mb-6`}>
                <h3 className={`text-sm font-semibold ${textPrimary} mb-3`}>Package Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Active</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className={`text-sm ${textPrimary}`}>Default Package</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`px-6 py-2 border ${borderColor} rounded-lg ${textPrimary} hover:bg-gray-50 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
