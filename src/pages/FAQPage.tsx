import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

export function FAQPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .eq('is_published', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setFaqs(data || []);
        } catch (error) {
            console.error('Error fetching FAQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = Array.from(new Set(faqs.map(f => f.category)));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl mb-6">
                        <HelpCircle className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
                        How can we help?
                    </h1>
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Find answers to common questions about ZimAIO, our marketplace, and how we serve the Zimbabwean community.
                    </p>
                </div>

                {/* Search */}
                <div className="relative mb-12">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none focus:border-cyan-500 outline-none transition-all text-lg font-medium"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {categories.map(category => {
                            const categoryFaqs = filteredFaqs.filter(f => f.category === category);
                            if (categoryFaqs.length === 0) return null;

                            return (
                                <section key={category}>
                                    <h2 className="text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em] mb-6 px-2">
                                        {category}
                                    </h2>
                                    <div className="space-y-4">
                                        {categoryFaqs.map((faq) => (
                                            <div
                                                key={faq.id}
                                                className={`bg-white dark:bg-slate-800/50 rounded-2xl border-2 transition-all duration-300 ${openId === faq.id
                                                        ? 'border-cyan-500 shadow-lg shadow-cyan-500/5'
                                                        : 'border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                                >
                                                    <span className={`text-lg font-bold tracking-tight ${openId === faq.id ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-900 dark:text-white'}`}>
                                                        {faq.question}
                                                    </span>
                                                    {openId === faq.id ? (
                                                        <ChevronUp className="h-5 w-5 text-cyan-600" />
                                                    ) : (
                                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                                    )}
                                                </button>
                                                {openId === faq.id && (
                                                    <div className="px-6 pb-6 animate-fadeIn">
                                                        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-4" />
                                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                                            {faq.answer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}

                        {filteredFaqs.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">No results found for your search</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
