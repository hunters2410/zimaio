import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { LayoutGrid, ArrowRight, ShoppingBag } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    image_url?: string; // Assuming categories have images, if not we'll use a placeholder
    description?: string;
}

export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('is_active', true)
                    .order('name');

                if (error) throw error;
                if (data) setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 transition-colors duration-300">
                <div className="container mx-auto px-4 py-8 md:py-12 text-center max-w-2xl">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-6 transition-transform">
                        <LayoutGrid className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
                        Explore Categories
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm md:text-base leading-relaxed">
                        Discover our wide range of premium products across various categories.
                        From electronics to fashion, find exactly what you need.
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-4 border border-gray-100 dark:border-slate-700 h-64 animate-pulse">
                                <div className="w-full h-40 bg-gray-100 dark:bg-slate-700 rounded-2xl mb-4"></div>
                                <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded w-1/4"></div>
                            </div>
                        ))}
                    </div>
                ) : categories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                to={`/products?category=${category.slug}`}
                                className="group bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-3 hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300 hover:-translate-y-1 block h-full flex flex-col"
                            >
                                <div className="relative aspect-[4/3] bg-gray-50 dark:bg-slate-700 rounded-2xl overflow-hidden mb-4">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700 group-hover:bg-green-50 dark:group-hover:bg-slate-600 transition-colors">
                                            <LayoutGrid className="w-12 h-12 text-gray-300 dark:text-slate-500 group-hover:text-green-300 transition-colors" />
                                        </div>
                                    )}

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                    <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-sm">
                                        <ArrowRight className="w-4 h-4 text-green-600" />
                                    </div>
                                </div>

                                <div className="px-2 pb-2 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">
                                        {category.name}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4">
                                        View Products
                                    </p>

                                    {/* Optional: Add a subtle 'Shop Now' button or link appearance */}
                                    <div className="mt-auto border-t border-gray-50 dark:border-slate-700 pt-3 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded-lg group-hover:bg-green-50 dark:group-hover:bg-green-900/20 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                            Collection
                                        </span>
                                        <ShoppingBag className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-500 transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 max-w-xl mx-auto">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LayoutGrid className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Categories Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Check back later or explore our products page.</p>
                        <Link
                            to="/products"
                            className="mt-6 inline-flex px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-green-700 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
