import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Download, Trash2, Search, Link as LinkIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface VendorPreRegistration {
    id: string;
    business_name: string;
    contact_person: string;
    phone: string;
    email: string;
    product_category: string;
    city: string;
    created_at: string;
}

export function VendorPreRegistrations() {
    const { theme } = useTheme();
    const [registrations, setRegistrations] = useState<VendorPreRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const itemsPerPage = 10;
    const isDark = theme === 'dark';
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1);
            fetchRegistrations();
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        fetchRegistrations();
    }, [currentPage]);

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('vendor_pre_registrations')
                .select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`business_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
            }

            const { data, count, error } = await query
                .order('created_at', { ascending: false })
                .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

            if (error) throw error;
            setRegistrations(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching vendor pre-registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRegistration = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this vendor registration?')) return;

        try {
            const { error } = await supabase
                .from('vendor_pre_registrations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Registration deleted successfully' });
            fetchRegistrations(); // Refresh current page
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error deleting registration:', error);
            setMessage({ type: 'error', text: 'Failed to delete registration' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const exportToCSV = async () => {
        try {
            // Fetch ALL matching records for export
            let query = supabase
                .from('vendor_pre_registrations')
                .select('*');

            if (searchTerm) {
                query = query.or(`business_name.ilike.%${searchTerm}%,contact_person.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;

            const headers = ['Business Name', 'Contact Person', 'Email', 'Phone', 'Category', 'City', 'Registration Date'];
            const csvData = (data || []).map(r => [
                r.business_name,
                r.contact_person,
                r.email,
                r.phone,
                r.product_category,
                r.city,
                new Date(r.created_at).toLocaleString()
            ]);

            const csvContent = [headers, ...csvData].map(e => `"${e.join('","')}"`).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `vendor-pre-registrations-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting CSV:', error);
            alert('Failed to export data');
        }
    };

    return (
        <AdminLayout>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Vendor Pre-Registration
                    </h1>
                    <p className={`text-sm tracking-tight font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage early access interest and potential vendor sign-ups
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/vendor-pre-register`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 outline-none text-white rounded font-bold text-xs hover:opacity-90 transition shadow-sm"
                    >
                        <LinkIcon className="h-4 w-4" />
                        {copied ? 'COPIED!' : 'COPY LINK'}
                    </button>
                    <button
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-bold text-xs hover:opacity-90 transition shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        EXPORT CSV
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                    }`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {message.text}
                </div>
            )}

            <div className={`${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'} rounded border shadow-sm`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by business, contact, email, or city..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 rounded border focus:border-cyan-500 outline-none text-xs transition ${isDark ? 'bg-slate-900/50 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                                }`}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'} text-[10px] font-bold uppercase tracking-widest`}>
                                <th className="px-6 py-4">Business</th>
                                <th className="px-6 py-4">Contact Person</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900 dark:border-white"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : registrations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-gray-500 uppercase">
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                registrations.map((reg) => (
                                    <tr key={reg.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{reg.business_name}</div>
                                            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{reg.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                {reg.contact_person}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">{reg.phone}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[9px] font-bold uppercase rounded border border-slate-200 dark:border-slate-700">
                                                {reg.product_category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 uppercase">{reg.city}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteRegistration(reg.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className={`px-6 py-4 border-t ${borderColor} flex items-center justify-between`}>
                    <p className={`text-xs ${textSecondary} font-bold`}>
                        Showing <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="text-slate-900 dark:text-white">{totalCount}</span> registrations
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1 || loading}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="px-3 py-1 font-black text-slate-900 dark:text-white text-xs">{currentPage}</span>
                        <button
                            disabled={currentPage * itemsPerPage >= totalCount || loading}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

export default VendorPreRegistrations;
