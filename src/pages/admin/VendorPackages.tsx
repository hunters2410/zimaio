import React, { useEffect, useState, useRef } from 'react';
import { Package, Plus, Edit2, Trash2, X, Check, AlertCircle, MoreVertical, Shield, Star, Crown, Zap } from 'lucide-react';
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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

  const cardBg = isDark ? 'white-glass' : 'bg-white';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-100';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';

  const getPackageIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('gold') || lower.includes('pro') || lower.includes('premium')) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (lower.includes('silver') || lower.includes('standard')) return <Star className="h-6 w-6 text-slate-400" />;
    if (lower.includes('basic') || lower.includes('starter')) return <Shield className="h-6 w-6 text-emerald-500" />;
    return <Zap className="h-6 w-6 text-cyan-500" />;
  };

  if (loading && packages.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
            <p className={`mt-4 ${textSecondary} font-medium tracking-wide`}>Loading packages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg shadow-lg">
              <Package className="h-8 w-8 text-white" />
            </div>
            <h1 className={`text-4xl font-extrabold tracking-tight ${textPrimary}`}>
              Vendor Packages
            </h1>
          </div>
          <p className={`${textSecondary} text-lg max-w-2xl`}>
            Create and manage subscription tiers to monetize your platform efficiently.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="group flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl active:scale-95"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-semibold">Create Package</span>
        </button>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-xl flex items-center shadow-lg transform transition-all animate-in slide-in-from-top-4 ${message.type === 'success'
          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600'
          : 'bg-red-500/10 border border-red-500/20 text-red-600'
          }`}>
          {message.type === 'success' ? <Check className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`group relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 ${cardBg} border ${borderColor} shadow-sm hover:shadow-2xl ${!pkg.is_active ? 'opacity-75 grayscale-[0.5]' : ''
              }`}
          >
            {/* Top Pattern Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500 ${!pkg.is_active
              ? 'bg-gradient-to-br from-red-500/10 to-orange-500/10'
              : 'bg-gradient-to-br from-cyan-500/5 to-emerald-500/5'
              }`}></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${!pkg.is_active
                  ? (isDark ? 'bg-red-900/20' : 'bg-red-100')
                  : (isDark ? 'bg-slate-700' : 'bg-slate-50')
                  }`}>
                  {getPackageIcon(pkg.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-bold ${textPrimary} tracking-tight`}>{pkg.name}</h3>
                    {!pkg.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                        Inactive
                      </span>
                    )}
                  </div>
                  {pkg.is_default && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full mt-1 inline-block">Default Choice</span>
                  )}
                </div>
              </div>

              {/* Kebab Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === pkg.id ? null : pkg.id);
                  }}
                  className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                >
                  <MoreVertical className="h-5 w-5" />
                </button>

                {/* Menu Dropdown */}
                {openMenuId === pkg.id && (
                  <div
                    ref={menuRef}
                    className={`absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-2xl border overflow-hidden z-20 animate-in fade-in zoom-in-95 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                      }`}
                  >
                    <button
                      onClick={() => handleEdit(pkg)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </button>
                    <button
                      onClick={() => toggleActive(pkg)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <div className={`h-px mx-4 ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors text-red-500 ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                        }`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className={`text-sm ${textSecondary} mb-8 leading-relaxed h-10 line-clamp-2`}>
              {pkg.description}
            </p>

            {/* Pricing */}
            <div className="mb-8">
              <div className="flex items-baseline">
                <span className={`text-4xl font-extrabold ${textPrimary} tracking-tight`}>
                  ${pkg.price_monthly}
                </span>
                <span className={`ml-1 text-sm font-medium ${textSecondary}`}>/mo</span>
              </div>
              {pkg.price_yearly > 0 && (
                <p className="text-xs font-semibold text-emerald-600 mt-1">
                  or ${pkg.price_yearly}/yr <span className="text-emerald-500/70 font-normal ml-1">• Save {Math.round((1 - pkg.price_yearly / (pkg.price_monthly * 12)) * 100)}%</span>
                </p>
              )}
            </div>

            {/* Features List with Modern Styling */}
            <div className={`space-y-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'} pt-6`}>
              <div className="flex items-center justify-between group/feature">
                <span className={`text-sm font-medium ${textSecondary} group-hover/feature:text-cyan-600 transition-colors`}>Products allowed</span>
                <span className={`bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold ${isDark ? 'bg-slate-700 text-slate-300' : ''}`}>
                  {pkg.product_limit > 9999 ? 'Unlimited' : pkg.product_limit}
                </span>
              </div>

              {/* Compact Key Features */}
              <div className="space-y-3 pt-2">
                {[
                  { label: 'POS System', has: pkg.has_pos_access },
                  { label: 'Online Store', has: pkg.has_shop_configurations },
                  { label: 'Analytics', has: pkg.has_analytics_access },
                  { label: 'Support', has: pkg.has_customer_support },
                ].map((feat, i) => (
                  <div key={i} className="flex items-center text-sm">
                    {feat.has ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mr-3 shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center mr-3 shrink-0">
                        <X className="h-3 w-3 text-slate-400" />
                      </div>
                    )}
                    <span className={feat.has ? textPrimary : textSecondary}>{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-8">
              <div className={`w-full py-2 rounded-xl text-center text-xs font-bold uppercase tracking-wider ${pkg.is_active
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
                }`}>
                {pkg.is_active ? 'Active Plan' : 'Archived'}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Code remains largely the same logic but structurally kept for CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'} rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all border`}>
            <div className={`p-8 border-b ${borderColor} flex items-center justify-between sticky top-0 ${isDark ? 'bg-slate-800/95' : 'bg-white/95'} backdrop-blur-md z-10`}>
              <div>
                <h2 className={`text-2xl font-bold ${textPrimary}`}>
                  {editingPackage ? 'Edit Package' : 'Create New Package'}
                </h2>
                <p className={textSecondary}>Configure features and pricing limits.</p>
              </div>
              <button
                onClick={handleCloseModal}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-900 text-gray-100 placeholder-slate-600' : 'bg-slate-50 text-slate-900'}`}
                    placeholder="e.g., Gold Tier"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-900 text-gray-100 placeholder-slate-600' : 'bg-slate-50 text-slate-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-900 text-gray-100 placeholder-slate-600' : 'bg-slate-50 text-slate-900'}`}
                  placeholder="Briefly describe who this package is for..."
                />
              </div>

              <div className={`p-6 rounded-2xl border ${borderColor} ${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <h3 className={`text-sm font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                  <Zap className="h-4 w-4 text-cyan-500" /> Pricing & Limits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                      Monthly ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price_monthly}
                      onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                      className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                      Yearly ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price_yearly}
                      onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                      className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-2`}>
                      Product Limit *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.product_limit}
                      onChange={(e) => setFormData({ ...formData, product_limit: parseInt(e.target.value) })}
                      className={`w-full px-4 py-3 border ${borderColor} rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${isDark ? 'bg-slate-800 text-gray-100' : 'bg-white'}`}
                      placeholder="Max products"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className={`text-sm font-bold ${textPrimary} mb-4 pb-2 border-b ${borderColor}`}>Core Features</h3>
                  <div className="space-y-3">
                    {[
                      ['has_catalog_management', 'Catalog Management'],
                      ['has_stock_management', 'Stock Management'],
                      ['has_orders_management', 'Orders Management'],
                      ['has_shop_configurations', 'Shop Configurations'],
                      ['has_notifications', 'Notifications'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          // @ts-ignore
                          formData[key] ? 'bg-cyan-500 border-cyan-500' : `${borderColor} bg-transparent`
                          }`}>
                          {/* @ts-ignore */}
                          {formData[key] && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {/* @ts-ignore */}
                        <input type="checkbox" className="hidden" checked={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })} />
                        <span className={`text-sm ${textSecondary} group-hover:${textPrimary} transition-colors`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className={`text-sm font-bold ${textPrimary} mb-4 pb-2 border-b ${borderColor}`}>Advanced Features</h3>
                  <div className="space-y-3">
                    {[
                      ['has_pos_access', 'POS Access'],
                      ['has_wallet_management', 'Wallet Management'],
                      ['has_shipping_management', 'Shipping Management'],
                      ['has_withdraw_management', 'Withdraw Management'],
                      ['has_reports_management', 'Reports & Analytics'],
                      ['has_customer_support', 'Customer Support'],
                      ['has_refund_management', 'Refund Management'],
                      ['has_kyc_verification', 'KYC Verification'],
                      ['has_ads_access', 'Ads Access'],
                      ['has_promotion_access', 'Promotions'],
                      ['has_analytics_access', 'Deep Analytics'],
                      ['has_priority_support', 'Priority Support'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          // @ts-ignore
                          formData[key] ? 'bg-emerald-500 border-emerald-500' : `${borderColor} bg-transparent`
                          }`}>
                          {/* @ts-ignore */}
                          {formData[key] && <Check className="h-3 w-3 text-white" />}
                        </div>
                        {/* @ts-ignore */}
                        <input type="checkbox" className="hidden" checked={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })} />
                        <span className={`text-sm ${textSecondary} group-hover:${textPrimary} transition-colors`}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-cyan-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-4' : ''}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <span className={`text-sm font-medium ${textPrimary}`}>Active Package</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${formData.is_default ? 'bg-cyan-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_default ? 'translate-x-4' : ''}`} />
                  </div>
                  <input type="checkbox" className="hidden" checked={formData.is_default} onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })} />
                  <span className={`text-sm font-medium ${textPrimary}`}>Default Choice</span>
                </label>
              </div>

              <div className="flex justify-end pt-6">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
                >
                  {loading ? 'Processing...' : (editingPackage ? 'Update Package' : 'Create Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
