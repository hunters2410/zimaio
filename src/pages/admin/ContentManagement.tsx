import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { FileText, HelpCircle, Plus, Edit2, Trash2, CheckCircle, AlertCircle, X, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    order_index: number;
    is_published: boolean;
}

interface SiteContent {
    id: string;
    slug: string;
    title: string;
    content: string;
    is_published: boolean;
}

export function ContentManagement() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<'faqs' | 'pages'>('faqs');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [pages, setPages] = useState<SiteContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form states
    const [editingFAQ, setEditingFAQ] = useState<Partial<FAQ> | null>(null);
    const [editingPage, setEditingPage] = useState<Partial<SiteContent> | null>(null);

    const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
    const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
    const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';
    const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: faqData, error: faqError } = await supabase
                .from('faqs')
                .select('*')
                .order('order_index', { ascending: true });

            const { data: pageData, error: pageError } = await supabase
                .from('site_content')
                .select('*')
                .order('title', { ascending: true });

            if (faqError) throw faqError;
            if (pageError) throw pageError;

            setFaqs(faqData || []);
            setPages(pageData || []);
        } catch (error: any) {
            console.error('Error fetching content:', error);
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    // FAQ Handlers
    const handleSaveFAQ = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingFAQ?.question || !editingFAQ?.answer) return;

        try {
            if (editingFAQ.id) {
                const { error } = await supabase
                    .from('faqs')
                    .update(editingFAQ)
                    .eq('id', editingFAQ.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([editingFAQ]);
                if (error) throw error;
            }
            setMessage({ type: 'success', text: 'FAQ saved successfully' });
            setEditingFAQ(null);
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleDeleteFAQ = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return;
        try {
            const { error } = await supabase.from('faqs').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'FAQ deleted' });
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    // Page Handlers
    const handleSavePage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPage?.title || !editingPage?.content || !editingPage?.slug) return;

        try {
            if (editingPage.id) {
                const { error } = await supabase
                    .from('site_content')
                    .update(editingPage)
                    .eq('id', editingPage.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('site_content')
                    .insert([editingPage]);
                if (error) throw error;
            }
            setMessage({ type: 'success', text: 'Page content saved successfully' });
            setEditingPage(null);
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    const handleDeletePage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page? This will remove it from the website.')) return;
        try {
            const { error } = await supabase.from('site_content').delete().eq('id', id);
            if (error) throw error;
            setMessage({ type: 'success', text: 'Page deleted' });
            fetchData();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        }
    };

    if (loading) {
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
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-cyan-600" />
                        <div>
                            <h1 className={`text-2xl font-bold ${textPrimary}`}>Content Management</h1>
                            <p className={`text-sm ${textSecondary}`}>Manage FAQs, About Us, Shipping & Returns information</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (activeTab === 'faqs') setEditingFAQ({ question: '', answer: '', category: 'General', order_index: faqs.length, is_published: true });
                            else setEditingPage({ title: '', content: '', slug: '', is_published: true });
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Add {activeTab === 'faqs' ? 'FAQ' : 'Page'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-start space-x-2 text-sm ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="h-4 w-4 mt-0.5" /> : <AlertCircle className="h-4 w-4 mt-0.5" />}
                    <span className="flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button
                    onClick={() => setActiveTab('faqs')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'faqs'
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        FAQs
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('pages')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pages'
                        ? 'border-cyan-600 text-cyan-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Site Pages
                    </div>
                </button>
            </div>

            {/* FAQ Tab Content */}
            {activeTab === 'faqs' && (
                <div className={`${cardBg} rounded-xl shadow-sm border ${borderColor} overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`bg-gray-50 dark:bg-gray-900/50 border-b ${borderColor}`}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>FAQ Details</th>
                                    <th className={`px-6 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Category</th>
                                    <th className={`px-6 py-3 text-left text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Status</th>
                                    <th className={`px-6 py-3 text-right text-xs font-semibold ${textSecondary} uppercase tracking-wider`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {faqs.map((faq) => (
                                    <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4">
                                            <div className={`text-sm font-bold ${textPrimary}`}>{faq.question}</div>
                                            <div className={`text-xs ${textSecondary} mt-1 line-clamp-1`}>{faq.answer}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-gray-100 dark:bg-gray-700 ${textSecondary}`}>
                                                {faq.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {faq.is_published ? (
                                                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                                    <CheckCircle className="h-3 w-3" /> Published
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                                    <XCircle className="h-3 w-3" /> Draft
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingFAQ(faq)} className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteFAQ(faq.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
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

            {/* Pages Tab Content */}
            {activeTab === 'pages' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map((page) => (
                        <div key={page.id} className={`${cardBg} rounded-2xl shadow-sm border-2 ${borderColor} p-6 hover:border-cyan-500/50 transition-all duration-300`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                                    <FileText className="h-6 w-6 text-cyan-600" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingPage(page)} className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDeletePage(page.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className={`text-lg font-black uppercase tracking-tight ${textPrimary} mb-2`}>{page.title}</h3>
                            <p className={`text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4`}>/{page.slug}</p>
                            <div className={`text-sm ${textSecondary} line-clamp-3 mb-6 font-medium leading-relaxed`}>
                                {page.content}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${page.is_published ? 'text-green-600' : 'text-gray-400'}`}>
                                    {page.is_published ? 'Published' : 'Draft'}
                                </span>
                                <span className={`text-[10px] font-bold text-gray-400 tracking-tighter`}>Dynamic Content</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FAQ Modal */}
            {editingFAQ && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${cardBg} rounded-[2rem] shadow-2xl max-w-2xl w-full border-2 border-slate-700 overflow-hidden`}>
                        <div className="p-8 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${textPrimary}`}>
                                {editingFAQ.id ? 'Edit FAQ' : 'New FAQ'}
                            </h2>
                            <button onClick={() => setEditingFAQ(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveFAQ} className="p-8 space-y-6">
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Question</label>
                                <input
                                    type="text"
                                    required
                                    value={editingFAQ.question}
                                    onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                                    className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Answer</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={editingFAQ.answer}
                                    onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                                    className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Category</label>
                                    <input
                                        type="text"
                                        value={editingFAQ.category}
                                        onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })}
                                        className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                    />
                                </div>
                                <div className="flex items-end pb-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingFAQ.is_published}
                                            onChange={(e) => setEditingFAQ({ ...editingFAQ, is_published: e.target.checked })}
                                            className="w-5 h-5 rounded border-2 border-cyan-500 text-cyan-600 focus:ring-cyan-500 bg-transparent"
                                        />
                                        <span className={`text-xs font-black uppercase tracking-widest ${textPrimary}`}>Published</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingFAQ(null)} className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-cyan-600 text-white text-sm font-black uppercase tracking-widest hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20">
                                    <Save className="h-4 w-4" /> Save FAQ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Page Modal */}
            {editingPage && (activeTab === 'pages') && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className={`${cardBg} rounded-[2rem] shadow-2xl max-w-4xl w-full border-2 border-slate-700 overflow-hidden`}>
                        <div className="p-8 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${textPrimary}`}>
                                {editingPage.id ? `Edit ${editingPage.title}` : 'New Site Page'}
                            </h2>
                            <button onClick={() => setEditingPage(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSavePage} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Page Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingPage.title}
                                        onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                                        className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Slug (URL Endpoint)</label>
                                    <input
                                        type="text"
                                        required
                                        value={editingPage.slug}
                                        onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                                        className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`block text-[10px] font-black uppercase tracking-widest ${textSecondary} mb-2 ml-1`}>Page Content (Markdown supported)</label>
                                <textarea
                                    required
                                    rows={10}
                                    value={editingPage.content}
                                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                                    className={`w-full px-5 py-3 rounded-xl border-2 ${borderColor} focus:border-cyan-500 outline-none transition-all font-mono text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingPage.is_published}
                                        onChange={(e) => setEditingPage({ ...editingPage, is_published: e.target.checked })}
                                        className="w-5 h-5 rounded border-2 border-cyan-500 text-cyan-600 focus:ring-cyan-500 bg-transparent"
                                    />
                                    <span className={`text-xs font-black uppercase tracking-widest ${textPrimary}`}>Published</span>
                                </label>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setEditingPage(null)} className="flex-1 px-6 py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
                                <button type="submit" className="flex-1 px-6 py-4 rounded-xl bg-cyan-600 text-white text-sm font-black uppercase tracking-widest hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20">
                                    <Save className="h-4 w-4" /> Save Page
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function XCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    )
}
