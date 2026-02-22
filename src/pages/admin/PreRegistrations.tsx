import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { Mail, Phone, MapPin, Building2, Calendar, Download, Trash2, Search } from 'lucide-react';

interface PreRegistration {
    id: string;
    full_name: string;
    email: string;
    company_name: string;
    mobile_number: string;
    city_area: string;
    interests: string[];
    created_at: string;
}

export function PreRegistrations() {
    const { theme } = useTheme();
    const [registrations, setRegistrations] = useState<PreRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const isDark = theme === 'dark';

    useEffect(() => {
        fetchRegistrations();
    }, []);

    const fetchRegistrations = async () => {
        try {
            const { data, error } = await supabase
                .from('customer_pre_registrations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRegistrations(data || []);
        } catch (error) {
            console.error('Error fetching pre-registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteRegistration = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this registration?')) return;

        try {
            const { error } = await supabase
                .from('customer_pre_registrations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRegistrations(registrations.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting registration:', error);
            alert('Failed to delete registration');
        }
    };

    const exportToCSV = () => {
        const headers = ['Full Name', 'Email', 'Company', 'Mobile', 'City/Area', 'Interests', 'Registration Date'];
        const csvData = registrations.map(r => [
            r.full_name,
            r.email,
            r.company_name || 'N/A',
            r.mobile_number,
            r.city_area,
            r.interests.join(', '),
            new Date(r.created_at).toLocaleString()
        ]);

        const csvContent = [headers, ...csvData].map(e => `"${e.join('","')}"`).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customer-pre-registrations-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredRegistrations = registrations.filter(r =>
        r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.city_area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Customer Pre-Registration
                    </h1>
                    <p className={`text-sm tracking-tight font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage early access interest and potential customers
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-bold text-xs hover:opacity-90 transition shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    EXPORT CSV
                </button>
            </div>

            <div className={`${isDark ? 'bg-gray-800/40 border-gray-700' : 'bg-white border-gray-200'} rounded border shadow-sm`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or city..."
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
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Company & Location</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Interests</th>
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
                            ) : filteredRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-xs font-medium text-gray-500 uppercase">
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                filteredRegistrations.map((reg) => (
                                    <tr key={reg.id} className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight">{reg.full_name}</div>
                                            <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">{reg.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                {reg.company_name || "—"}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">{reg.city_area}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono text-gray-600 dark:text-gray-400">{reg.mobile_number}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {reg.interests.length > 0 ? reg.interests.map(i => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 text-[9px] font-bold uppercase rounded border border-slate-200 dark:border-slate-700">
                                                        {i}
                                                    </span>
                                                )) : "—"}
                                            </div>
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
            </div>
        </AdminLayout>
    );
}

export default PreRegistrations;
