import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface UserRole {
  id: string;
  role_name: string;
  role_description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
}

export function UserRolesManagement() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    role_name: '',
    role_description: '',
    permissions: [] as string[],
    is_active: true
  });

  const availablePermissions = [
    'view_dashboard',
    'manage_users',
    'manage_vendors',
    'manage_products',
    'manage_orders',
    'manage_finances',
    'view_reports',
    'manage_settings',
    'manage_content',
    'manage_promotions'
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false });

    setRoles(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRole) {
      await supabase
        .from('user_roles')
        .update({
          role_name: formData.role_name,
          role_description: formData.role_description,
          permissions: formData.permissions,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRole.id);
    } else {
      await supabase
        .from('user_roles')
        .insert([{
          role_name: formData.role_name,
          role_description: formData.role_description,
          permissions: formData.permissions,
          is_active: formData.is_active
        }]);
    }

    fetchRoles();
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      await supabase.from('user_roles').delete().eq('id', id);
      fetchRoles();
    }
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const resetForm = () => {
    setFormData({
      role_name: '',
      role_description: '',
      permissions: [],
      is_active: true
    });
    setEditingRole(null);
    setShowAddModal(false);
  };

  const openEditModal = (role: UserRole) => {
    setEditingRole(role);
    setFormData({
      role_name: role.role_name,
      role_description: role.role_description,
      permissions: role.permissions,
      is_active: role.is_active
    });
    setShowAddModal(true);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">User Roles Management</h1>
          <p className="text-gray-600">Define custom roles and permissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Role
        </button>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{role.role_name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      role.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {role.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-600">{role.role_description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(role)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(role.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role_name}
                    onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.role_description}
                    onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availablePermissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="rounded text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm">
                          {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  {editingRole ? 'Update' : 'Create'} Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}