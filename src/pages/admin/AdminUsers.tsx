import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { PermissionGuard } from '../../components/PermissionGuard';
import { Plus, Users, Shield, Copy, CheckCircle2, UserPlus, FileEdit, Trash2, Mail } from 'lucide-react';

interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
}

export function AdminUsers() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role_id: '' // selected RBAC role
    });

    const [availableRoles, setAvailableRoles] = useState<{ id: string, role_name: string }[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorHeader, setErrorHeader] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isToggling, setIsToggling] = useState<string | null>(null);

    // Auto-clear success message
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, is_active')
            .in('role', ['admin', 'staff', 'sub_admin'])
            .order('role', { ascending: true })
            .order('full_name', { ascending: true });

        if (!error && data) {
            setUsers(data as AdminUser[]);
        }

        // Fetch available RBAC roles
        const { data: rolesData } = await supabase
            .from('user_roles')
            .select('id, role_name')
            .eq('is_active', true)
            .order('role_name');

        if (rolesData) {
            setAvailableRoles(rolesData);
            if (rolesData.length > 0 && !formData.role_id) {
                setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
            }
        }

        setLoading(false);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorHeader(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('You must be logged in to perform this action.');
            }

            const { data, error } = await supabase.functions.invoke('create-admin-user', {
                body: formData
            });

            if (error) throw new Error(error.message || 'Failed to create user');
            if (data?.error) throw new Error(data.error);

            setShowCreateModal(false);
            setFormData({ full_name: '', email: '', password: '', role_id: availableRoles[0]?.id || '' });
            setSuccessMessage(`User "${formData.full_name}" created successfully.`);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setErrorHeader(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setIsSubmitting(true);
        setErrorHeader(null);

        try {
            const { data, error } = await supabase.functions.invoke('manage-admin-user', {
                body: {
                    action: 'update_user',
                    userId: editingUser.id,
                    payload: formData
                }
            });

            if (error) throw new Error(error.message || 'Failed to update user');
            if (data?.error) throw new Error(data.error);

            setEditingUser(null);
            const updatedName = formData.full_name;
            setFormData({ full_name: '', email: '', password: '', role_id: availableRoles[0]?.id || '' });
            setSuccessMessage(`User "${updatedName}" updated successfully.`);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            setErrorHeader(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete admin user "${name}"? This action cannot be undone.`)) return;

        try {
            const { data, error } = await supabase.functions.invoke('manage-admin-user', {
                body: { action: 'delete', userId }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setSuccessMessage(`User "${name}" deleted successfully.`);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to delete user');
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean, name: string) => {
        setIsToggling(userId);
        try {
            const { data, error } = await supabase.functions.invoke('manage-admin-user', {
                body: {
                    action: 'toggle_status',
                    userId,
                    payload: { is_active: !currentStatus }
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            setSuccessMessage(`User "${name}" status ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to update status');
        } finally {
            setIsToggling(null);
        }
    };

    const openEditModal = async (user: AdminUser) => {
        // Find the role_id for this user
        const { data: assignment } = await supabase
            .from('user_role_assignments')
            .select('role_id')
            .eq('user_id', user.id)
            .maybeSingle();

        setFormData({
            full_name: user.full_name || '',
            email: user.email,
            password: '', // Leave empty if not changing
            role_id: assignment?.role_id || ''
        });
        setEditingUser(user);
    };

    return (
        <AdminLayout>
            <PermissionGuard feature="roles" action="read">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Users</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage system access for staff and sub-admins. Use the Roles & Permissions page to assign granular access to these users.
                        </p>
                    </div>
                    <PermissionGuard feature="roles" action="create" silent>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Create User
                        </button>
                    </PermissionGuard>
                </div>

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                            {successMessage}
                        </p>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="ml-auto text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-medium">User</th>
                                    <th className="px-6 py-4 font-medium">System Role</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            No admin users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                                                        {u.full_name?.charAt(0) || u.email?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900 dark:text-white">
                                                            {u.full_name}
                                                        </div>
                                                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${u.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : u.role === 'sub_admin'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                    <Shield className="h-3 w-3" />
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${u.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {u.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(u.id, u.is_active, u.full_name)}
                                                        disabled={isToggling === u.id}
                                                        className={`p-2 rounded-lg transition-colors ${u.is_active
                                                            ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                                            }`}
                                                        title={u.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <CheckCircle2 className={`h-4 w-4 ${isToggling === u.id ? 'animate-pulse' : ''}`} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <FileEdit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id, u.full_name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

                {/* Create/Edit Modal */}
                {(showCreateModal || editingUser) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    {editingUser ? (
                                        <FileEdit className="h-5 w-5 text-blue-500" />
                                    ) : (
                                        <UserPlus className="h-5 w-5 text-emerald-500" />
                                    )}
                                    {editingUser ? 'Edit Admin User' : 'Create Admin User'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setEditingUser(null);
                                        setFormData({ full_name: '', email: '', password: '', role_id: availableRoles[0]?.id || '' });
                                    }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
                                {errorHeader && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-500/20">
                                        {errorHeader}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="e.g. Liam Smith"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder="e.g. liam@zimaio.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        {editingUser ? 'New Password (Optional)' : 'Initial Password'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        minLength={6}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                        placeholder={editingUser ? 'Leave blank to keep same' : '••••••••'}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Assign Role
                                    </label>
                                    <select
                                        required
                                        value={formData.role_id}
                                        onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
                                    >
                                        <option value="" disabled>Select a role...</option>
                                        {availableRoles.map(r => (
                                            <option key={r.id} value={r.id}>{r.role_name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Select the granular permissions role for this user. "Admin" roles grant full access.
                                    </p>
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setEditingUser(null);
                                            setFormData({ full_name: '', email: '', password: '', role_id: availableRoles[0]?.id || '' });
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-6 py-2 ${editingUser ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors`}
                                    >
                                        {isSubmitting ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </PermissionGuard>
        </AdminLayout>
    );
}
