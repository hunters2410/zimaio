import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Store, Check, X, Star, Search, Mail, Calendar, DollarSign, Plus, Edit, Trash2, Eye, UserX, UserCheck, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';

interface VendorProfile {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  tax_id: string | null;
  kyc_status: string;
  kyc_documents: any;
  subscription_plan: string;
  subscription_expires_at: string | null;
  is_approved: boolean;
  is_verified: boolean;
  is_featured: boolean;
  rating: number;
  total_sales: number;
  created_at: string;
  profile?: {
    email: string;
    full_name: string;
    phone: string;
    is_active: boolean;
  };
}

interface VendorFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  shop_name: string;
  shop_description: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  tax_id: string;
}

interface VendorPackage {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  is_default: boolean;
}

export function VendorManagement() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShopInfoModal, setShowShopInfoModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [packages, setPackages] = useState<VendorPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [formData, setFormData] = useState<VendorFormData>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    shop_name: '',
    shop_description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    tax_id: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchVendors();
    fetchPackages();
  }, [filterStatus, startDate, endDate]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_packages')
        .select('id, name, description, price_monthly, is_default')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setPackages(data || []);
      const defaultPkg = data?.find(pkg => pkg.is_default);
      if (defaultPkg) {
        setSelectedPackage(defaultPkg.id);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    let query = supabase
      .from('vendor_profiles')
      .select(`
        *,
        profile:profiles!vendor_profiles_user_id_fkey(
          email,
          full_name,
          phone,
          is_active
        ),
        orders(subtotal, status, payment_status)
      `)
      .order('created_at', { ascending: false });

    if (filterStatus === 'approved') {
      query = query.eq('is_approved', true);
    } else if (filterStatus === 'pending') {
      query = query.eq('is_approved', false);
    }

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }

    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateTime.toISOString());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching vendors:', error);
      setMessage({ type: 'error', text: 'Error fetching vendors: ' + error.message });
    } else {
      const processedVendors = (data || []).map((v: any) => ({
        ...v,
        total_sales: (v.orders as any[])?.reduce((sum, order) => {
          // Count paid, delivered, or completed orders
          if (order.payment_status === 'paid' || ['delivered', 'completed'].includes(order.status)) {
            return sum + (Number(order.subtotal) || 0);
          }
          return sum;
        }, 0) || 0
      }));
      setVendors(processedVendors);
    }
    setLoading(false);
  };

  const toggleFeatured = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ is_featured: !currentStatus })
      .eq('id', vendorId);

    if (error) {
      console.error('Error toggling featured status:', error);
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Vendor featured status updated successfully!' });
      fetchVendors();
    }
  };

  const toggleVerified = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ is_verified: !currentStatus })
      .eq('id', vendorId);

    if (error) {
      console.error('Error toggling verified status:', error);
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Vendor verification status updated successfully!' });
      fetchVendors();
    }
  };

  const toggleApproved = async (vendorId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('vendor_profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', vendorId);

    if (error) {
      console.error('Error toggling approved status:', error);
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Vendor approval status updated successfully!' });
      fetchVendors();
    }
  };

  const toggleActive = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentStatus })
      .eq('id', userId);

    if (error) {
      console.error('Error toggling active status:', error);
      setMessage({ type: 'error', text: 'Failed to update: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'User account status updated successfully!' });
      fetchVendors();
    }
  };

  const handleRegisterVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Use a temporary client to avoid logging out the admin
    const tempSupabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError || !authData.user) {
      setMessage({ type: 'error', text: 'Failed to create vendor account: ' + authError?.message });
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        role: 'vendor',
      });

    if (profileError) {
      setMessage({ type: 'error', text: 'Failed to create profile: ' + profileError.message });
      setLoading(false);
      return;
    }

    const { error: vendorError } = await supabase
      .from('vendor_profiles')
      .insert({
        user_id: authData.user.id,
        shop_name: formData.shop_name,
        shop_description: formData.shop_description,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        business_address: formData.business_address,
        tax_id: formData.tax_id,
      });

    if (vendorError) {
      setMessage({ type: 'error', text: 'Failed to create vendor profile: ' + vendorError.message });
      setLoading(false);
      return;
    }

    if (selectedPackage) {
      const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
      const currentDate = new Date();
      const periodEnd = new Date(currentDate);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { error: subscriptionError } = await supabase
        .from('vendor_subscriptions')
        .insert([{
          vendor_id: authData.user.id,
          package_id: selectedPackage,
          status: selectedPkg?.price_monthly === 0 ? 'active' : 'pending',
          billing_cycle: 'monthly',
          current_period_start: currentDate.toISOString(),
          current_period_end: periodEnd.toISOString(),
        }]);

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
      }
    }

    setMessage({ type: 'success', text: 'Vendor registered successfully!' });
    // setShowRegisterModal(false); // Keep modal open
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      shop_name: '',
      shop_description: '',
      business_email: '',
      business_phone: '',
      business_address: '',
      tax_id: '',
    });
    const defaultPkg = packages.find(pkg => pkg.is_default);
    if (defaultPkg) {
      setSelectedPackage(defaultPkg.id);
    }
    fetchVendors();
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    setLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
      })
      .eq('id', selectedVendor.user_id);

    if (profileError) {
      setMessage({ type: 'error', text: 'Failed to update user profile: ' + profileError.message });
      setLoading(false);
      return;
    }

    const { error: vendorError } = await supabase
      .from('vendor_profiles')
      .update({
        shop_name: formData.shop_name,
        shop_description: formData.shop_description,
        business_email: formData.business_email,
        business_phone: formData.business_phone,
        business_address: formData.business_address,
        tax_id: formData.tax_id,
      })
      .eq('id', selectedVendor.id);

    if (vendorError) {
      setMessage({ type: 'error', text: 'Failed to update vendor profile: ' + vendorError.message });
      setLoading(false);
      return;
    }

    setMessage({ type: 'success', text: 'Vendor ' + formData.shop_name + ' updated successfully!' });
    setShowEditModal(false);
    setSelectedVendor(null);
    fetchVendors();
  };

  const handleDeleteVendor = async (vendor: VendorProfile) => {
    if (!confirm(`Are you sure you want to delete vendor "${vendor.shop_name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', vendor.user_id);

    if (error) {
      alert('Failed to delete vendor: ' + error.message);
    } else {
      fetchVendors();
    }
  };

  const openEditModal = (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    setFormData({
      email: vendor.profile?.email || '',
      password: '',
      full_name: vendor.profile?.full_name || '',
      phone: vendor.profile?.phone || '',
      shop_name: vendor.shop_name,
      shop_description: vendor.shop_description || '',
      business_email: vendor.business_email || '',
      business_phone: vendor.business_phone || '',
      business_address: vendor.business_address || '',
      tax_id: vendor.tax_id || '',
    });
    setShowEditModal(true);
  };

  const openShopInfoModal = (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    setShowShopInfoModal(true);
  };

  const openKYCModal = (vendor: VendorProfile) => {
    setSelectedVendor(vendor);
    setShowKYCModal(true);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.business_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">Manage and monitor vendor accounts</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Register Vendor
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search vendors by shop name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="End Date"
            />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${filterStatus === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-lg transition ${filterStatus === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-lg transition ${filterStatus === 'pending'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-white">
            <tr>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 border border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredVendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-white">
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {vendor.shop_logo_url ? (
                        <img
                          src={vendor.shop_logo_url}
                          alt={vendor.shop_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {vendor.shop_name}
                      </div>
                      <div className="text-sm text-gray-500">KYC: {vendor.kyc_status}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {vendor.business_email || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.profile?.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {vendor.profile?.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.is_approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {vendor.is_approved ? 'Approved' : 'Pending'}
                    </span>
                    {vendor.is_verified && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                    {vendor.is_featured && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                  <div className="flex flex-col text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                      {vendor.rating.toFixed(1)}/5.0
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      ${vendor.total_sales.toFixed(2)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(vendor.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 border border-gray-200 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => openEditModal(vendor)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-blue-600 hover:bg-blue-50"
                      title="Edit vendor"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => openShopInfoModal(vendor)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-gray-600 hover:bg-gray-50"
                      title="View shop info"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Shop
                    </button>
                    <button
                      onClick={() => openKYCModal(vendor)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-purple-600 hover:bg-purple-50"
                      title="View KYC documents"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      KYC
                    </button>
                    <button
                      onClick={() => toggleActive(vendor.user_id, vendor.profile?.is_active || false)}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${vendor.profile?.is_active
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                        }`}
                      title={vendor.profile?.is_active ? 'Deactivate vendor' : 'Activate vendor'}
                    >
                      {vendor.profile?.is_active ? (
                        <>
                          <UserX className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleApproved(vendor.id, vendor.is_approved)}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${vendor.is_approved
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                        }`}
                      title={vendor.is_approved ? 'Disapprove vendor' : 'Approve vendor'}
                    >
                      {vendor.is_approved ? (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Disapprove
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleVerified(vendor.id, vendor.is_verified)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-blue-600 hover:bg-blue-50"
                      title={vendor.is_verified ? 'Unverify vendor' : 'Verify vendor'}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {vendor.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(vendor.id, vendor.is_featured)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-yellow-600 hover:bg-yellow-50"
                      title={vendor.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {vendor.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor)}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50"
                      title="Delete vendor"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No vendors found matching your criteria.
          </div>
        )}
      </div>

      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Register Vendor</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {message && (
              <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleRegisterVendor} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Email</label>
                  <input
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Phone</label>
                  <input
                    type="tel"
                    value={formData.business_phone}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Business Address</label>
                  <textarea
                    rows={2}
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shop Description</label>
                  <textarea
                    rows={2}
                    value={formData.shop_description}
                    onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subscription Package *</label>
                  <select
                    required
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a package</option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.price_monthly}/month {pkg.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-gray-400">Select the subscription package for this vendor</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3 py-1.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {message && (
              <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 text-xs font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {message.text}
              </div>
            )}
            <form onSubmit={handleEditVendor} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Email (readonly)</label>
                  <input
                    type="email"
                    disabled
                    value={formData.email}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={formData.shop_name}
                    onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Business Email</label>
                  <input
                    type="email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Business Phone</label>
                  <input
                    type="tel"
                    value={formData.business_phone}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tax ID</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Business Address</label>
                  <textarea
                    rows={1}
                    value={formData.business_address}
                    onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Shop Description</label>
                  <textarea
                    rows={2}
                    value={formData.shop_description}
                    onChange={(e) => setFormData({ ...formData, shop_description: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1.5 text-sm font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShopInfoModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Shop Information</h2>
              <button
                onClick={() => setShowShopInfoModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Shop Name</h3>
                  <p className="mt-1 text-lg text-gray-900">{selectedVendor.shop_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Shop Description</h3>
                  <p className="mt-1 text-gray-900">{selectedVendor.shop_description || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Email</h3>
                    <p className="mt-1 text-gray-900">{selectedVendor.business_email || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Business Phone</h3>
                    <p className="mt-1 text-gray-900">{selectedVendor.business_phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Business Address</h3>
                  <p className="mt-1 text-gray-900">{selectedVendor.business_address || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Tax ID</h3>
                    <p className="mt-1 text-gray-900">{selectedVendor.tax_id || 'N/A'}</p>
                  </div>

                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Subscription Plan</h3>
                    <p className="mt-1 text-gray-900 capitalize">{selectedVendor.subscription_plan}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Subscription Expires</h3>
                    <p className="mt-1 text-gray-900">
                      {selectedVendor.subscription_expires_at
                        ? new Date(selectedVendor.subscription_expires_at).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      ${selectedVendor.total_sales.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                    <p className="mt-1 text-lg font-semibold text-yellow-600">
                      {selectedVendor.rating.toFixed(1)}/5.0
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowShopInfoModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showKYCModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">KYC Documents</h2>
              <button
                onClick={() => setShowKYCModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">KYC Status</h3>
                  <span
                    className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${selectedVendor.kyc_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : selectedVendor.kyc_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {selectedVendor.kyc_status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted Documents</h3>
                  {selectedVendor.kyc_documents && Array.isArray(selectedVendor.kyc_documents) && selectedVendor.kyc_documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedVendor.kyc_documents.map((doc: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              View Document
                            </a>
                          )}
                          {doc.type && <p className="text-xs text-gray-500">Type: {doc.type}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No documents submitted yet</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowKYCModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
