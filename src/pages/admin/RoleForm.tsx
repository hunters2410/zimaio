import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Shield, Plus, Edit, Trash2, AlertCircle, Check, Save, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface RoleFormData {
  role_name: string;
  role_description: string;
  permissions: Record<string, Record<string, boolean>>;
  is_active: boolean;
}

const FEATURES = [
  { key: 'customers', label: 'Customer Management', description: 'Manage customer accounts and data' },
  { key: 'vendors', label: 'Vendor Management', description: 'Manage vendor accounts and shops' },
  { key: 'products', label: 'Product Management', description: 'Manage product catalog' },
  { key: 'orders', label: 'Order Management', description: 'Process and manage orders' },
  { key: 'financial', label: 'Financial Management', description: 'Wallet, transactions, commissions' },
  { key: 'analytics', label: 'Analytics & Reports', description: 'View analytics and reports' },
  { key: 'settings', label: 'System Settings', description: 'Configure system settings' },
  { key: 'support', label: 'Support Tickets', description: 'Manage customer support' },
  { key: 'delivery', label: 'Delivery Management', description: 'Manage deliveries and drivers' },
  { key: 'kyc', label: 'KYC Verification', description: 'Verify vendor documents' },
  { key: 'roles', label: 'Roles & Permissions', description: 'Manage roles and permissions' },
  { key: 'refunds', label: 'Refund Management', description: 'Process refund requests' },
  { key: 'coupons', label: 'Coupon Management', description: 'Create and manage coupons' },
  { key: 'reviews', label: 'Review Management', description: 'Moderate product reviews' },
  { key: 'notifications', label: 'Notifications', description: 'Send and manage notifications' },
];

const PERMISSIONS = [
  { key: 'create', label: 'Create', icon: Plus, color: 'text-green-600' },
  { key: 'read', label: 'View', icon: Check, color: 'text-blue-600' },
  { key: 'update', label: 'Edit', icon: Edit, color: 'text-yellow-600' },
  { key: 'delete', label: 'Delete', icon: Trash2, color: 'text-red-600' },
];

export function RoleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getDefaultPermissions = () => {
    const defaultPermissions: Record<string, Record<string, boolean>> = {};
    FEATURES.forEach(feature => {
      defaultPermissions[feature.key] = {
        create: false,
        read: false,
        update: false,
        delete: false,
      };
    });
    return defaultPermissions;
  };

  const [formData, setFormData] = useState<RoleFormData>({
    role_name: '',
    role_description: '',
    permissions: getDefaultPermissions(),
    is_active: true,
  });

  useEffect(() => {
    if (isEditing) {
      fetchRole();
    }
  }, [id]);

  const fetchRole = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const permissions = data.permissions || getDefaultPermissions();
        const completePermissions = getDefaultPermissions();

        Object.keys(completePermissions).forEach(feature => {
          if (permissions[feature]) {
            completePermissions[feature] = permissions[feature];
          }
        });

        setFormData({
          role_name: data.role_name,
          role_description: data.role_description || '',
          permissions: completePermissions,
          is_active: data.is_active,
        });
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

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('user_roles')
          .update({
            role_name: formData.role_name,
            role_description: formData.role_description,
            permissions: formData.permissions,
            is_active: formData.is_active,
          })
          .eq('id', id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Role updated successfully' });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({
            role_name: formData.role_name,
            role_description: formData.role_description,
            permissions: formData.permissions,
            is_active: formData.is_active,
          });

        if (error) throw error;
        setMessage({ type: 'success', text: 'Role created successfully' });
      }

      setTimeout(() => {
        navigate('/admin/roles-permissions');
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || `Failed to ${isEditing ? 'update' : 'create'} role` });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (feature: string, permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [feature]: {
          ...(prev.permissions[feature] || {}),
          [permission]: !(prev.permissions[feature]?.[permission] || false),
        },
      },
    }));
  };

  const toggleAllPermissions = (feature: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [feature]: {
          create: value,
          read: value,
          update: value,
          delete: value,
        },
      },
    }));
  };

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/roles-permissions')}
          className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Roles & Permissions
        </button>
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-cyan-600" />
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary}`}>
              {isEditing ? 'Edit Role' : 'Create New Role'}
            </h1>
            <p className={textSecondary}>
              {isEditing ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
            </p>
          </div>
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
        </div>
      )}

      <form onSubmit={handleSubmit} className={`${cardBg} rounded-lg shadow-sm p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
              Role Name *
            </label>
            <input
              type="text"
              required
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
              placeholder="e.g., Manager, Supervisor"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${textPrimary} mb-2`}>
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.role_description}
              onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
              className={`w-full px-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
              placeholder="Brief description of this role"
            />
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
            <span className={`text-sm ${textPrimary}`}>Active Role</span>
          </label>
        </div>

        <div className="mb-6">
          <h3 className={`text-xl font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
            <Shield className="h-5 w-5 text-cyan-600" />
            Permissions
          </h3>
          <div className="space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.key} className={`p-4 border ${borderColor} rounded-lg`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className={`font-semibold ${textPrimary}`}>{feature.label}</h4>
                    <p className={`text-sm ${textSecondary}`}>{feature.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAllPermissions(feature.key, true)}
                      className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAllPermissions(feature.key, false)}
                      className="text-xs px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PERMISSIONS.map((perm) => (
                    <label
                      key={perm.key}
                      className={`flex items-center space-x-2 cursor-pointer p-3 rounded-lg border transition ${
                        formData.permissions[feature.key]?.[perm.key]
                          ? `bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-700`
                          : `${borderColor} hover:bg-gray-50 dark:hover:bg-gray-700`
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions[feature.key]?.[perm.key] || false}
                        onChange={() => togglePermission(feature.key, perm.key)}
                        className="rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <perm.icon className={`h-4 w-4 ${perm.color}`} />
                      <span className={`text-sm font-medium ${textPrimary}`}>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/admin/roles-permissions')}
            className={`px-6 py-2 border ${borderColor} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {loading ? 'Processing...' : isEditing ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
