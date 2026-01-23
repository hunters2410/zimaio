import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { FileCheck, Edit, Eye, Save, X, AlertCircle, Clock, Check, List, Grid } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Contract {
    id: string;
    contract_type: string;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    effective_date: string;
    created_at: string;
    updated_at: string;
}

export function LogisticContracts() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [viewingContract, setViewingContract] = useState<Contract | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        version: '',
    });

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .in('contract_type', ['logistic_terms', 'logistic_privacy'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContracts(data || []);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (contract: Contract) => {
        setEditingContract(contract);
        setFormData({
            title: contract.title,
            content: contract.content,
            version: contract.version,
        });
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingContract) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('contracts')
                .update({
                    title: formData.title,
                    content: formData.content,
                    version: formData.version,
                })
                .eq('id', editingContract.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Contract updated successfully' });
            setEditingContract(null);
            fetchContracts();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (contract: Contract) => {
        try {
            const { error } = await supabase
                .from('contracts')
                .update({ is_active: !contract.is_active })
                .eq('id', contract.id);

            if (error) throw error;

            setMessage({
                type: 'success',
                text: `Contract ${contract.is_active ? 'deactivated' : 'activated'} successfully`,
            });
            fetchContracts();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const getContractTypeLabel = (type: string) => {
        switch (type) {
            case 'logistic_terms':
                return 'Logistic Terms & Conditions';
            case 'logistic_privacy':
                return 'Logistic Privacy Policy';
            default:
                return type;
        }
    };

    if (loading && contracts.length === 0) {
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
                    <div className="flex items-center gap-3">
                        <FileCheck className="h-8 w-8 text-cyan-600" />
                        <div>
                            <h1 className={`text-3xl font-bold ${textPrimary}`}>Logistic Contracts</h1>
                            <p className={textSecondary}>Manage logistic terms and conditions and privacy policy</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'list'
                                ? 'bg-cyan-600 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <List className="h-4 w-4" />
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'grid'
                                ? 'bg-cyan-600 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Grid className="h-4 w-4" />
                            Grid
                        </button>
                    </div>
                </div>
            </div>

            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                        }`}
                >
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {viewMode === 'list' ? (
                <div className={`${cardBg} rounded-lg shadow-sm border ${borderColor} overflow-hidden mb-8`}>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                                    Contract Type
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                                    Title
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                                    Version
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                                    Status
                                </th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${textSecondary} uppercase`}>
                                    Last Updated
                                </th>
                                <th className={`px-6 py-3 text-center text-xs font-medium ${textSecondary} uppercase`}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className={`${cardBg} divide-y divide-gray-200 dark:divide-gray-700`}>
                            {contracts.map((contract) => (
                                <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FileCheck className="h-5 w-5 text-cyan-600" />
                                            <span className={`text-sm font-medium ${textPrimary}`}>
                                                {getContractTypeLabel(contract.contract_type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-sm ${textPrimary}`}>{contract.title}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm ${textSecondary}`}>{contract.version}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${contract.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {contract.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm ${textSecondary}`}>
                                            {new Date(contract.updated_at).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setViewingContract(contract)}
                                                className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition"
                                                title="View"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(contract)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(contract)}
                                                className={`p-2 rounded-lg transition ${contract.is_active
                                                    ? 'text-red-600 hover:bg-red-50'
                                                    : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={contract.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {contract.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {contracts.length === 0 && (
                        <div className={`text-center py-12 ${textSecondary}`}>
                            No contracts found.
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {contracts.map((contract) => (
                        <div key={contract.id} className={`${cardBg} rounded-lg shadow-sm border ${borderColor} p-6`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileCheck className="h-5 w-5 text-cyan-600" />
                                        <h3 className={`text-lg font-semibold ${textPrimary}`}>
                                            {getContractTypeLabel(contract.contract_type)}
                                        </h3>
                                    </div>
                                    <p className={`text-sm ${textSecondary} mb-3`}>{contract.title}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className={`flex items-center gap-1 ${textSecondary}`}>
                                            Version: {contract.version}
                                        </span>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${contract.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {contract.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className={`text-sm ${textSecondary} mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">Last Updated:</span>
                                </div>
                                <span>{new Date(contract.updated_at).toLocaleString()}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewingContract(contract)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition"
                                >
                                    <Eye className="h-4 w-4" />
                                    View
                                </button>
                                <button
                                    onClick={() => handleEdit(contract)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleToggleActive(contract)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${contract.is_active
                                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                        }`}
                                >
                                    {contract.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))}

                    {contracts.length === 0 && (
                        <div className={`text-center py-12 ${textSecondary} col-span-full`}>
                            No contracts found.
                        </div>
                    )}
                </div>
            )}

            {editingContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className={`${cardBg} rounded-lg shadow-xl max-w-4xl w-full my-8`}>
                        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                            <h2 className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}>
                                <Edit className="h-6 w-6 text-cyan-600" />
                                Edit Contract
                            </h2>
                            <button
                                onClick={() => setEditingContract(null)}
                                className={`${textSecondary} hover:text-gray-600 transition`}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-5">
                            <div className="space-y-3 mb-5">
                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>
                                        Contract Type
                                    </label>
                                    <input
                                        type="text"
                                        value={getContractTypeLabel(editingContract.contract_type)}
                                        disabled
                                        className={`w-full px-3 py-1.5 text-xs border ${borderColor} rounded-md bg-gray-100 dark:bg-gray-700 ${textSecondary}`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>Title *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className={`w-full px-3 py-1.5 text-xs border ${borderColor} rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                                                }`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>
                                            Version *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.version}
                                            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                                            className={`w-full px-3 py-1.5 text-xs border ${borderColor} rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                                                }`}
                                            placeholder="e.g., 2.0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-bold uppercase tracking-wider ${textSecondary} mb-1.5`}>
                                        Content * (Markdown supported)
                                    </label>
                                    <textarea
                                        required
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={12}
                                        className={`w-full px-3 py-2 text-xs border ${borderColor} rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-white'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingContract(null)}
                                    className={`px-4 py-1.5 text-xs font-medium border ${borderColor} rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-green-600 text-white rounded-md hover:from-cyan-700 hover:to-green-700 transition disabled:opacity-50"
                                >
                                    <Save className="h-3.5 w-3.5" />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewingContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className={`${cardBg} rounded-lg shadow-xl max-w-4xl w-full my-8`}>
                        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
                            <div>
                                <h2 className={`text-2xl font-bold ${textPrimary} flex items-center gap-2 mb-1`}>
                                    <FileCheck className="h-6 w-6 text-cyan-600" />
                                    {viewingContract.title}
                                </h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className={textSecondary}>Version {viewingContract.version}</span>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${viewingContract.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {viewingContract.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewingContract(null)}
                                className={`${textSecondary} hover:text-gray-600 transition`}
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}>
                                <pre className="whitespace-pre-wrap font-sans">{viewingContract.content}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
