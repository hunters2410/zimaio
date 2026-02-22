import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FileText, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

export function DynamicPage() {
    const { slug } = useParams<{ slug: string }>();

    const [page, setPage] = useState<{ title: string; content: string; updated_at: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // If slug is not provided directly (e.g. /about), we determine it from the path
        const currentSlug = (slug || window.location.pathname.split('/').pop() || '').toLowerCase();
        if (currentSlug) fetchPage(currentSlug);
    }, [slug]);

    const fetchPage = async (pageSlug: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('site_content')
                .select('*')
                .eq('slug', pageSlug)
                .eq('is_published', true)
                .single();

            if (error) throw error;
            setPage(data);
        } catch (error) {
            console.error('Error fetching page:', error);
            setPage(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!page) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
                <h1 className="text-9xl font-black text-slate-200 dark:text-slate-800 absolute -z-10 select-none">404</h1>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Page Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium">The content you are looking for has been moved or doesn't exist.</p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-cyan-700 transition shadow-lg shadow-cyan-600/20">
                        <ArrowLeft className="h-4 w-4" /> Return Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Breadcrumb / Back */}
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-10 group">
                    <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" /> Back to Home
                </Link>

                {/* Article Container */}
                <article className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-900/5 dark:shadow-none border-2 border-slate-50 dark:border-slate-700/50 overflow-hidden">
                    {/* Hero Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-10 md:p-14 border-b-2 border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                                <FileText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em]">Official Policy</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 leading-[0.9]">
                            {page.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 items-center pt-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                <Clock className="h-4 w-4" />
                                Updated: {new Date(page.updated_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-green-500 dark:text-green-400 uppercase tracking-widest">
                                <ShieldCheck className="h-4 w-4" />
                                Verified by ZimAIO
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-10 md:p-14">
                        <div className="prose prose-lg dark:prose-invert max-w-none">
                            <div className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                                {page.content}
                            </div>
                        </div>

                        {/* Support Callout */}
                        <div className="mt-16 p-8 bg-cyan-50 dark:bg-cyan-900/10 rounded-3xl border-2 border-cyan-100 dark:border-cyan-900/20">
                            <h3 className="text-lg font-black text-cyan-900 dark:text-cyan-100 uppercase tracking-tight mb-2">Need more clarification?</h3>
                            <p className="text-sm text-cyan-700/80 dark:text-cyan-400/80 mb-6 font-medium">
                                Our support team is available 24/7 to help you with any specific questions regarding our {page.title.toLowerCase()}.
                            </p>
                            <Link to="/contact" className="inline-flex px-6 py-3 bg-cyan-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-cyan-700 transition shadow-lg shadow-cyan-600/20">
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </article>

                {/* Footer info */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em]">ZimAIO Legal Framework &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
}
