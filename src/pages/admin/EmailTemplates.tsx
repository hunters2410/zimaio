import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Mail, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { AdminLayout } from '../../components/AdminLayout';
import { Pagination } from '../../components/Pagination';

interface EmailTemplate {
    id: string;
    template_name: string;
    template_subject: string;
    template_body: string;
    template_type: string;
    variables: string[];
    is_active: boolean;
    created_at: string;
}

const TEMPLATE_TYPES = [
    'welcome',
    'order_confirmation',
    'shipping_notification',
    'refund_processed',
    'password_reset',
    'vendor_approval',
    'custom'
];

export default function EmailTemplates() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 8;

    const [formData, setFormData] = useState({
        template_name: '',
        template_subject: '',
        template_body: '',
        template_type: 'custom',
        variables: '[]',
        is_active: true
    });

    useEffect(() => {
        loadTemplates();
    }, [currentPage]);

    const loadTemplates = async () => {
        try {
            const { data, error, count } = await supabase
                .from('email_templates')
                .select('*', { count: 'exact' })
                .order('template_name', { ascending: true })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setTemplates(data || []);
            setTotalItems(count || 0);
        } catch (error) {
            console.error('Error loading email templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (tmpl: EmailTemplate) => {
        setEditingId(tmpl.id);
        setFormData({
            template_name: tmpl.template_name,
            template_subject: tmpl.template_subject,
            template_body: tmpl.template_body,
            template_type: tmpl.template_type,
            variables: JSON.stringify(tmpl.variables || []),
            is_active: tmpl.is_active
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this template? This may break automated emails.')) return;

        try {
            const { error } = await supabase.from('email_templates').delete().eq('id', id);
            if (error) throw error;
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template. It may be locked or referenced.');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('email_templates')
                .update({ is_active: !currentStatus })
                .eq('id', id);
            if (error) throw error;
            loadTemplates();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let parsedVariables = [];
            try {
                parsedVariables = JSON.parse(formData.variables);
                if (!Array.isArray(parsedVariables)) throw new Error('Variables must be a JSON array of strings');
            } catch (err) {
                alert('Invalid variables JSON array. Example: ["customer_name", "order_number"]');
                return;
            }

            const payload = {
                template_name: formData.template_name.trim(),
                template_subject: formData.template_subject,
                template_body: formData.template_body,
                template_type: formData.template_type,
                variables: parsedVariables,
                is_active: formData.is_active,
                updated_at: new Date().toISOString()
            };

            if (editingId) {
                const { error } = await supabase.from('email_templates').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('email_templates').insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingId(null);
            loadTemplates();
        } catch (error: any) {
            console.error('Error saving template:', error);
            alert(error.message || 'Failed to save template');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                </div>
            </AdminLayout>
        );
    }

    // Calculate pagination display values
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = currentPage * itemsPerPage;
    const currentTemplates = templates; // Already paginated from server
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Mail className="h-6 w-6 mr-2 text-cyan-600" />
                            Email Templates
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage database-driven HTML email templates
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                template_name: '',
                                template_subject: '',
                                template_body: '',
                                template_type: 'custom',
                                variables: '[]',
                                is_active: true
                            });
                            setShowModal(true);
                        }}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Template
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                {currentTemplates.map((tmpl) => (
                                    <tr key={tmpl.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-gray-900 dark:text-white">{tmpl.template_name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-1">Vars: {tmpl.variables?.length || 0}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-700 dark:text-gray-300 line-clamp-2 text-sm">{tmpl.template_subject}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-300 rounded-full text-xs font-medium capitalize">
                                                {tmpl.template_type.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleToggleActive(tmpl.id, tmpl.is_active)}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${tmpl.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                                                    }`}
                                            >
                                                {tmpl.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(tmpl)}
                                                className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300 mx-2 transition"
                                                title="Edit Template"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tmpl.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition"
                                                title="Delete Template"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                            No email templates found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> to{' '}
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {Math.min(indexOfLastItem, templates.length)}
                                </span>{' '}
                                of <span className="font-medium text-gray-900 dark:text-white">{templates.length}</span> templates
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    Previous
                                </button>
                                <div className="flex space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-1 text-sm rounded-md transition ${currentPage === page
                                                ? 'bg-cyan-600 text-white border-transparent'
                                                : 'border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit/Add Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingId ? 'Edit Email Template' : 'Add New Template'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                <form id="templateForm" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Template Name (Unique Key) *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.template_name}
                                                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                                                disabled={!!editingId} // Often template_name is effectively immutable as a key
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-cyan-500 text-gray-900 dark:text-white disabled:opacity-50"
                                                placeholder="e.g. customer_welcome"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Template Type *
                                            </label>
                                            <select
                                                required
                                                value={formData.template_type}
                                                onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-cyan-500 text-gray-900 dark:text-white"
                                            >
                                                {TEMPLATE_TYPES.map(type => (
                                                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Template Subject *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.template_subject}
                                            onChange={(e) => setFormData({ ...formData, template_subject: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-cyan-500 text-gray-900 dark:text-white font-semibold"
                                            placeholder="Welcome to ZimAIO, {{customer_name}}!"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Dynamic Variables (JSON Array)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.variables}
                                            onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-cyan-500 font-mono text-sm text-gray-900 dark:text-white"
                                            placeholder='["customer_name", "order_id"]'
                                        />
                                        <p className="mt-1 text-xs text-gray-500">List the raw variable names here. Use them as {'{{variable_name}}'} in subject & body.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            HTML Body *
                                        </label>
                                        <textarea
                                            required
                                            rows={12}
                                            value={formData.template_body}
                                            onChange={(e) => setFormData({ ...formData, template_body: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg focus:ring-cyan-500 font-mono text-sm text-gray-900 dark:text-white"
                                            placeholder="<html><body><h1>Hi {{customer_name}}!</h1></body></html>"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 dark:bg-slate-700 dark:border-slate-600"
                                        />
                                        <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                                            Template is Active
                                        </label>
                                    </div>
                                </form>
                            </div>

                            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    form="templateForm"
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-lg hover:from-cyan-700 hover:to-green-700 transition flex items-center"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {editingId ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
