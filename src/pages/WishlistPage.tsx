import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, ShoppingCart, ArrowRight, Store } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    images: string[];
    vendor_id: string;
    currency_code: string;
    vendor?: {
        shop_name: string;
    };
}

export function WishlistPage() {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const { calculatePrice } = useSettings();
    const { addToCart } = useCart();
    const { toggleWishlist } = useWishlist();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchWishlist = async () => {
        try {
            const { data, error } = await supabase
                .from('wishlists')
                .select(`
          product_id,
          products (
            id,
            name,
            slug,
            base_price,
            images,
            vendor_id,
            currency_code,
            vendor_profiles (
              shop_name
            )
          )
        `)
                .eq('user_id', user?.id);

            if (error) throw error;

            if (data) {
                const wishlistedProducts = data
                    .map((item: any) => ({
                        ...item.products,
                        vendor: item.products.vendor_profiles
                    }))
                    .filter(p => p !== null);
                setProducts(wishlistedProducts);
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        await toggleWishlist(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">My Wishlist</h1>
                        <p className="text-rose-500 font-bold uppercase tracking-[0.3em] text-[10px]">Saved Premium Items</p>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-full border border-rose-100 dark:border-rose-800/50">
                        <span className="text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-widest">{products.length} Items</span>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-16 text-center shadow-2xl shadow-slate-900/5 border-2 border-slate-50 dark:border-slate-700">
                        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <Heart className="w-10 h-10 text-rose-500" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4">Your Wishlist is Empty</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-sm mx-auto mb-10 text-sm">Elevate your shopping experience by saving your favorite high-end finds here.</p>
                        <Link to="/products" className="inline-flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all">
                            Go Shopping <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((product) => (
                            <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-[1.5rem] overflow-hidden border-2 border-slate-50 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                                <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-slate-700">
                                    <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <button
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full text-gray-400 hover:text-rose-500 border border-gray-100 dark:border-slate-700 shadow-sm transition-all"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => addToCart({
                                                id: product.id,
                                                name: product.name,
                                                price: calculatePrice(product.base_price).total,
                                                image: product.images?.[0] || '',
                                                vendor_id: product.vendor_id,
                                                vendor: product.vendor?.shop_name || 'Vendor',
                                                base_price: product.base_price,
                                                quantity: 1
                                            })}
                                            className="w-full bg-white text-gray-900 py-2 rounded-lg font-black uppercase tracking-widest text-[8px] flex items-center justify-center gap-2 hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                        >
                                            <ShoppingCart className="w-3 h-3" /> Add to Cart
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center gap-1.5 text-[7px] font-black text-rose-500 uppercase tracking-widest mb-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 rounded-full w-fit">
                                        <Store className="w-2.5 h-2.5" /> {product.vendor?.shop_name}
                                    </div>
                                    <Link to={`/products/${product.slug}`}>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2 line-clamp-1 group-hover:text-rose-500 transition-colors">{product.name}</h3>
                                    </Link>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-black text-gray-900 dark:text-white font-mono">
                                            {formatPrice(calculatePrice(product.base_price).total)}
                                        </span>
                                        <Link to={`/products/${product.slug}`} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
