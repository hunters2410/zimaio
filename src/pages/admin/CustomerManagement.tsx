import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Search, UserX, UserCheck, Mail, Phone, Calendar, Plus, Edit, Trash2, Eye, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  language_code: string;
  currency_code: string;
  two_factor_enabled: boolean;
  last_login: string | null;
  created_at: string;
}

interface CustomerFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  currency_code: string;
  language_code: string;
  is_active: boolean;
}

export function CustomerManagement() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<CustomerFormData>({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    currency_code: 'USD',
    language_code: 'en',
    is_active: true,
  });

  useEffect(() => {
    fetchCustomers();
  }, [filterStatus, startDate, endDate]);

  const fetchCustomers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('is_active', filterStatus === 'active');
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
      setMessage({ type: 'error', text: error.message });
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', customerId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Customer ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });
      fetchCustomers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            role: 'customer',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            currency_code: formData.currency_code,
            language_code: formData.language_code,
            is_active: formData.is_active,
            role: 'customer',
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      setMessage({ type: 'success', text: 'Customer created successfully' });
      handleCloseModal();
      fetchCustomers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create customer' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setLoading(true);

    try {
      const updates: any = {
        full_name: formData.full_name,
        phone: formData.phone,
        currency_code: formData.currency_code,
        language_code: formData.language_code,
        is_active: formData.is_active,
      };

      if (formData.email !== selectedCustomer.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
        updates.email = formData.email;
      }

      if (formData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password,
        });
        if (passwordError) throw passwordError;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Customer updated successfully' });
      handleCloseModal();
      fetchCustomers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update customer' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(customerId);
      if (error) throw error;

      setMessage({ type: 'success', text: 'Customer deleted successfully' });
      fetchCustomers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete customer' });
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditing(true);
    setFormData({
      email: customer.email,
      password: '',
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      currency_code: customer.currency_code || 'USD',
      language_code: customer.language_code || 'en',
      is_active: customer.is_active,
    });
    setShowModal(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowViewModal(false);
    setSelectedCustomer(null);
    setIsEditing(false);
    setFormData({
      email: '',
      password: '',
      full_name: '',
      phone: '',
      currency_code: 'USD',
      language_code: 'en',
      is_active: true,
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  if (loading && customers.length === 0) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>Customer Management</h1>
            <p className={textSecondary}>Manage and monitor customer accounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={`${cardBg} rounded-lg shadow-sm p-6 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary} h-5 w-5`} />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
              placeholder="End Date"
            />

            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-gradient-to-r from-cyan-600 to-green-600 text-white'
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'active'
                  ? 'bg-gradient-to-r from-cyan-600 to-green-600 text-white'
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-lg transition ${
                filterStatus === 'inactive'
                  ? 'bg-gradient-to-r from-cyan-600 to-green-600 text-white'
                  : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      <div className={`${cardBg} rounded-lg shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                  Contact
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                  Joined
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase tracking-wider`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${textPrimary}`}>
                        {customer.full_name || 'N/A'}
                      </div>
                      <div className={`text-sm ${textSecondary}`}>{customer.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center text-sm ${textSecondary}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className={`flex items-center text-sm ${textSecondary}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        customer.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {customer.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {customer.is_verified && (
                      <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Verified
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm ${textSecondary}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleView(customer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-cyan-600 hover:text-cyan-900"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleCustomerStatus(customer.id, customer.is_active)}
                        className={customer.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={customer.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {customer.is_active ? <UserX className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className={`text-center py-12 ${textSecondary}`}>
            No customers found matching your criteria.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                {isEditing ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={handleCloseModal} className={`${textSecondary} hover:text-gray-600 transition`}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={isEditing ? handleUpdate : handleCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Password {isEditing ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!isEditing}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                    minLength={6}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                    Language
                  </label>
                  <select
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                    className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className={`text-sm ${textPrimary}`}>Active Account</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`px-4 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 transition`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : isEditing ? 'Update Customer' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
              <h2 className={`text-2xl font-bold ${textPrimary}`}>Customer Details</h2>
              <button onClick={handleCloseModal} className={`${textSecondary} hover:text-gray-600 transition`}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${textSecondary}`}>Full Name</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Email</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Phone</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Language</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.language_code}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Status</p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedCustomer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCustomer.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>2FA Enabled</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.two_factor_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Verified</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>{selectedCustomer.is_verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Joined</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    {new Date(selectedCustomer.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${textSecondary}`}>Last Login</p>
                  <p className={`text-lg font-medium ${textPrimary}`}>
                    {selectedCustomer.last_login
                      ? new Date(selectedCustomer.last_login).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
