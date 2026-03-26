import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Shield, Plus, Edit, Trash2, Users, X, AlertCircle, Search, LayoutGrid, List } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Pagination } from '../../components/Pagination';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRoles();
  }, [currentPage, searchTerm]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_roles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`role_name.ilike.%${searchTerm}%,role_description.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setRoles(data || []);
      setTotalRoles(count || 0);
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

  // Roles are now filtered on the server via query
  const filteredRoles = roles;

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
        <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success'
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

      <div className={`${cardBg} rounded-lg shadow-sm p-6 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between`}>
        <div className="relative flex-1 w-full">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textSecondary} h-5 w-5`} />
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full pl-10 pr-4 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'}`}
          />
        </div>
        <div className={`flex items-center gap-1 p-1 rounded-lg border ${borderColor} ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'list'
              ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow')
              : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
              }`}
            title="List View"
          >
            <List className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all flex items-center justify-center ${viewMode === 'grid'
              ? (isDark ? 'bg-gray-700 text-white shadow' : 'bg-white text-gray-900 shadow')
              : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
              }`}
            title="Grid View"
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
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
                  <span className={`px-2 py-1 text-xs rounded-full ${role.is_active
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
      ) : (
        <div className={`${cardBg} rounded-lg border ${borderColor} overflow-hidden shadow-sm`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={`text-xs ${textSecondary} uppercase bg-gray-50 dark:bg-gray-800/50 border-b ${borderColor}`}>
                <tr>
                  <th className="px-6 py-4 font-medium">Role Name</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Permissions Summary</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${borderColor}`}>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                        <span className={`font-semibold ${textPrimary}`}>{role.role_name}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${textSecondary} max-w-xs truncate`}>
                      {role.role_description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium ${role.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(role.permissions || {}).map(([feature, perms]) => {
                          const activePerms = Object.entries(perms as Record<string, boolean>)
                            .filter(([_, value]) => value)
                            .length;
                          if (activePerms > 0) {
                            return (
                              <span key={feature} className="px-2 py-1 text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 rounded">
                                {feature} ({activePerms})
                              </span>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/roles-permissions/edit/${role.id}`)}
                          className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            setShowAssignModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition"
                          title="Assign"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id, role.role_name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredRoles.length === 0 && (
        <div className={`${cardBg} rounded-lg shadow-sm p-12 text-center`}>
          <Shield className={`h-12 w-12 ${textSecondary} mx-auto mb-4`} />
          <p className={`${textSecondary} mb-4`}>No roles found</p>
        </div>
      )}

      {!loading && totalRoles > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalItems={totalRoles}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            isDark={isDark}
          />
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const itemsPerPage = 5; // Smaller for modal

  useEffect(() => {
    fetchUsersAndAssignments();
  }, [currentPage]);

  const fetchUsersAndAssignments = async () => {
    setLoading(true);
    try {
      const [usersData, assignmentsData] = await Promise.all([
        supabase.from('profiles').select('id, email, full_name, role').in('role', ['admin', 'staff', 'sub_admin']),
        supabase
          .from('user_role_assignments')
          .select(`
            *,
            user:profiles!user_role_assignments_user_id_fkey(id, email, full_name)
          `, { count: 'exact' })
          .eq('role_id', role.id)
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1),
      ]);

      if (usersData.error) throw usersData.error;
      if (assignmentsData.error) throw assignmentsData.error;

      setUsers(usersData.data || []);
      setAssignments(assignmentsData.data || []);
      setTotalAssignments(assignmentsData.count || 0);
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
            <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success'
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

          {!loading && totalAssignments > itemsPerPage && (
            <div className="mt-6 border-t pt-4">
              <Pagination
                currentPage={currentPage}
                totalItems={totalAssignments}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                isDark={isDark}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
