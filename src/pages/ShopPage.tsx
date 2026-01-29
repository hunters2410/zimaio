import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Store, Star, MapPin, ShieldCheck, ShoppingBag, Package, ArrowLeft, MessageSquare, Send, AlertCircle, Check, Search, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

interface VendorShop {
    id: string;
    user_id: string;
    shop_name: string;
    shop_description: string;
    shop_logo_url: string;
    shop_banner_url: string;
    is_verified: boolean;
    rating: number;
}

interface Product {
    id: string;
    name: string;
    base_price: number;
    images: string[];
    slug: string;
    is_active: boolean;
    category: { name: string; slug: string };
}

interface VendorReview {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
        full_name: string;
    };
}

export function ShopPage() {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId: string }>();
    const { user } = useAuth();
    const { openChat } = useChat();
    const [vendor, setVendor] = useState<VendorShop | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [reviews, setReviews] = useState<VendorReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSuccess, setReviewSuccess] = useState(false);

    useEffect(() => {
        if (userId) fetchShopData();
    }, [userId]);

    const fetchShopData = async () => {
        setLoading(true);
        try {
            // Fetch Vendor Profile
            const { data: vendorData } = await supabase
                .from('vendor_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (vendorData) {
                setVendor(vendorData);

                // Fetch Vendor's Products
                const { data: productData } = await supabase
                    .from('products')
                    .select('*, category:categories(name, slug)')
                    .eq('vendor_id', vendorData.id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (productData) setProducts(productData);

                // Fetch Vendor Reviews
                const { data: reviewsData } = await supabase
                    .from('vendor_reviews')
                    .select('*, user:profiles(full_name)')
                    .eq('vendor_id', vendorData.id)
                    .order('created_at', { ascending: false });

                if (reviewsData) setReviews(reviewsData);
            }
        } catch (error) {
            console.error('Error fetching shop data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!vendor) return;

        setSubmittingReview(true);
        setReviewError(null);
        try {
            const { error: reviewError } = await supabase
                .from('vendor_reviews')
                .insert({
                    vendor_id: vendor.id,
                    user_id: user.id,
                    rating: newRating,
                    comment: newComment
                });

            if (reviewError) throw reviewError;

            setReviewSuccess(true);
            setNewComment('');
            setNewRating(5);
            fetchShopData(); // Refresh reviews and vendor rating

            setTimeout(() => setReviewSuccess(false), 3000);
        } catch (err: any) {
            setReviewError(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Opening Shop...</p>
                </div>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 transition-colors duration-300">
                <div className="text-center max-w-md">
                    <Store className="w-20 h-20 text-gray-200 dark:text-slate-700 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase mb-4">Store Not Found</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">The shop you are looking for might have moved or closed down.</p>
                    <Link to="/vendors" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Vendors
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            {/* Banner Section */}
            <div className="h-[250px] md:h-[300px] relative overflow-hidden bg-gray-900 dark:bg-slate-950">
                {vendor.shop_banner_url ? (
                    <img src={vendor.shop_banner_url} className="w-full h-full object-cover opacity-60" alt={vendor.shop_name} />
                ) : (
                    <div className="w-full h-full bg-emerald-900/40 flex items-center justify-center" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-slate-900 via-transparent to-transparent" />
            </div>

            {/* Profile Section */}
            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-slate-950/50 p-6 md:p-8 border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-700 p-1.5 rounded-2xl shadow-xl border border-gray-50 dark:border-slate-600 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {vendor.shop_logo_url ? (
                                <img src={vendor.shop_logo_url} className="w-full h-full object-cover rounded-xl" alt={vendor.shop_name} />
                            ) : (
                                <Store className="w-12 h-12 text-emerald-500" />
                            )}
                        </div>
                        <div className="flex-1 mt-2">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{vendor.shop_name}</h1>
                                {vendor.is_verified && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-800">
                                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-[8px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Verified Merchant</span>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-2xl mb-6">
                                {vendor.shop_description || "Certified ZimAIO partner committed to providing superior products."}
                            </p>
                            <button
                                onClick={() => {
                                    if (!user) {
                                        navigate('/login');
                                        return;
                                    }
                                    if (vendor) {
                                        openChat(vendor.id, vendor.shop_name);
                                    }
                                }}
                                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 mb-4"
                            >
                                <MessageCircle className="w-4 h-4" /> Message Vendor
                            </button>
                            <div className="flex flex-wrap gap-4 items-center border-t border-gray-50 dark:border-slate-700 pt-6 mt-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Rating</span>
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="text-base font-black text-gray-900 dark:text-white">{(vendor.rating || 5.0).toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-100 dark:bg-slate-700 hidden sm:block" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Catalog</span>
                                    <div className="flex items-center gap-1.5">
                                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                                        <span className="text-base font-black text-gray-900 dark:text-white">{products.length} Items</span>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-gray-100 dark:bg-slate-700 hidden sm:block" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">Presence</span>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        <span className="text-base font-black text-gray-900 dark:text-white">Zimbabwe</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="mt-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Catalog Items</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Products from {vendor.shop_name}</p>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 p-20 text-center shadow-sm">
                            <Package className="w-20 h-20 text-gray-200 dark:text-slate-700 mx-auto mb-6" />
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Inventory Empty</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">This vendor has no active products listed currently.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {products.map((product: Product) => (
                                <Link
                                    key={product.id}
                                    to={`/products/${product.slug}`}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300"
                                >
                                    <div className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-slate-700">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={product.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="w-8 h-8 text-gray-200 dark:text-slate-500" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2">
                                            <span className="px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full text-[8px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                                                {product.category?.name || 'Item'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs mb-2 uppercase tracking-tight group-hover:text-emerald-600 transition-colors line-clamp-1 leading-tight">
                                            {product.name}
                                        </h4>
                                        <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-700 pt-2">
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">${product.base_price.toFixed(2)}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (product.category?.slug) {
                                                            navigate(`/products?category=${product.category.slug}`);
                                                        }
                                                    }}
                                                    className="w-6 h-6 bg-gray-50 dark:bg-slate-700 hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white text-gray-400 dark:text-gray-500 rounded-lg flex items-center justify-center transition-all"
                                                    title="Find Similar"
                                                >
                                                    <Search className="w-3.5 h-3.5" />
                                                </button>
                                                <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Vendor Reviews Section */}
                <div className="mt-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Shop Ratings</h2>
                            <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-8">Customer feedback for {vendor.shop_name}.</p>

                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm mb-6 text-left">
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{(vendor.rating || 5.0).toFixed(1)}</div>
                                    <div className="flex justify-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(vendor.rating || 5.0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 dark:text-slate-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">{reviews.length} Store Reviews</p>
                                </div>

                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = reviews.filter((r: VendorReview) => r.rating === star).length;
                                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-2 shrink-0">{star}</span>
                                                <div className="flex-1 h-1.5 bg-gray-50 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-6 shrink-0 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Shop Review Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-xl shadow-emerald-900/5 text-left">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2 text-sm">
                                    <MessageSquare className="w-4 h-4 text-emerald-600" /> Rate Vendor
                                </h3>
                                {!user ? (
                                    <div className="text-center py-2">
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-2">Sign in to share your experience</p>
                                        <Link to="/login" className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline">Sign In Now</Link>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block text-center">Your Rating</label>
                                            <div className="flex justify-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewRating(star)}
                                                        className={`p-1 transition-all ${newRating >= star ? 'scale-110' : 'opacity-30 hover:opacity-100'}`}
                                                    >
                                                        <Star className={`w-6 h-6 ${newRating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-slate-600'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <textarea
                                                required
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Service feedback..."
                                                rows={3}
                                                className="w-full bg-gray-50 dark:bg-slate-900 border border-transparent rounded-xl p-4 text-xs font-medium text-gray-900 dark:text-white focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                            />
                                        </div>
                                        {reviewError && (
                                            <div className="bg-red-50 text-red-600 text-[8px] font-bold p-3 rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> {reviewError}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 ${reviewSuccess
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                                : submittingReview
                                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                                    : 'bg-gray-900 dark:bg-slate-700 text-white hover:bg-emerald-600'
                                                }`}
                                        >
                                            {reviewSuccess ? (
                                                <><Check className="w-3 h-3" /> Posted</>
                                            ) : submittingReview ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Send className="w-3 h-3" /> Submit</>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Reviews List */}
                        <div className="lg:col-span-2 space-y-4">
                            {reviews.length === 0 ? (
                                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 p-12 text-center shadow-sm">
                                    <MessageSquare className="w-12 h-12 text-gray-100 dark:text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Awaiting Feedback</h3>
                                    <p className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest">Be the first to rate your experience.</p>
                                </div>
                            ) : (
                                reviews.map((review: VendorReview) => (
                                    <div key={review.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-slate-700 shadow-sm text-left">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 uppercase text-sm">
                                                    {review.user?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-xs">{review.user?.full_name || 'Verified Customer'}</h5>
                                                    <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                                        {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400">{review.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic text-sm">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
