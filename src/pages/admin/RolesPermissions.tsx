import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Shield, Plus, Edit, Trash2, Users, X, AlertCircle, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Role {
  id: string;
  role_name: string;
  role_description: string;
  permissions: Record<string, Record<string, boolean>>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export function RolesPermissions() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Role deleted successfully' });
      fetchRoles();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete role' });
    }
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter(role =>
    role.role_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.role_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  if (loading && roles.length === 0) {
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textPrimary} flex items-center gap-2`}>
              <Shield className="h-8 w-8 text-cyan-600" />
              Roles & Permissions
            </h1>
            <p className={textSecondary}>Manage system roles and permissions</p>
          </div>
          <button
            onClick={() => navigate('/admin/roles-permissions/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Create Role</span>
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
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary} h-5 w-5`} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <div key={role.id} className={`${cardBg} rounded-lg shadow-sm p-6 border ${borderColor}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-cyan-600" />
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>{role.role_name}</h3>
                </div>
                <p className={`text-sm ${textSecondary} mb-3`}>{role.role_description}</p>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  role.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-xs font-medium ${textSecondary} mb-2`}>Permissions Summary:</p>
              <div className="flex flex-wrap gap-1">
                {Object.entries(role.permissions || {}).map(([feature, perms]) => {
                  const activePerms = Object.entries(perms as Record<string, boolean>)
                    .filter(([_, value]) => value)
                    .length;
                  if (activePerms > 0) {
                    return (
                      <span key={feature} className="px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded">
                        {feature} ({activePerms})
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => navigate(`/admin/roles-permissions/edit/${role.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  setSelectedRole(role);
                  setShowAssignModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
              >
                <Users className="h-4 w-4" />
                Assign
              </button>
              <button
                onClick={() => handleDelete(role.id, role.role_name)}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className={`${cardBg} rounded-lg shadow-sm p-12 text-center`}>
          <Shield className={`h-12 w-12 ${textSecondary} mx-auto mb-4`} />
          <p className={`${textSecondary} mb-4`}>No roles found</p>
        </div>
      )}

      {showAssignModal && selectedRole && (
        <RoleAssignment
          role={selectedRole}
          onClose={handleCloseModal}
          isDark={isDark}
        />
      )}
    </AdminLayout>
  );
}

interface RoleAssignmentProps {
  role: Role;
  onClose: () => void;
  isDark: boolean;
}

function RoleAssignment({ role, onClose, isDark }: RoleAssignmentProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

  useEffect(() => {
    fetchUsersAndAssignments();
  }, []);

  const fetchUsersAndAssignments = async () => {
    setLoading(true);
    try {
      const [usersData, assignmentsData] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role').eq('role', 'admin'),
        supabase
          .from('user_role_assignments')
          .select(`
            *,
            user:profiles!user_role_assignments_user_id_fkey(id, email, full_name)
          `)
          .eq('role_id', role.id),
      ]);

      if (usersData.error) throw usersData.error;
      if (assignmentsData.error) throw assignmentsData.error;

      setUsers(usersData.data || []);
      setAssignments(assignmentsData.data || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const { error } = await supabase.from('user_role_assignments').insert({
        user_id: selectedUser,
        role_id: role.id,
        expires_at: expiresAt || null,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Role assigned successfully' });
      setSelectedUser('');
      setExpiresAt('');
      fetchUsersAndAssignments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Role unassigned successfully' });
      fetchUsersAndAssignments();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>
            Assign Role: {role.role_name}
          </h2>
          <button onClick={onClose} className={`${textSecondary} hover:text-gray-600 transition`}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
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

          <form onSubmit={handleAssign} className="mb-6">
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Assign to User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                  Select User *
                </label>
                <select
                  required
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                >
                  <option value="">Choose user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1`}>
                  Expires At (Optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
            >
              Assign Role
            </button>
          </form>

          <div>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Current Assignments</h3>
            {assignments.length === 0 ? (
              <p className={`text-center py-8 ${textSecondary}`}>No users assigned to this role</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`flex items-center justify-between p-3 border ${borderColor} rounded-lg`}
                  >
                    <div>
                      <p className={`font-medium ${textPrimary}`}>
                        {assignment.user?.full_name || assignment.user?.email}
                      </p>
                      {assignment.expires_at && (
                        <p className={`text-sm ${textSecondary}`}>
                          Expires: {new Date(assignment.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnassign(assignment.id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
