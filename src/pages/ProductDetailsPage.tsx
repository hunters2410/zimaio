import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Star,
    Package,
    ArrowLeft,
    Store,
    ShieldCheck,
    MessageCircle,
    Send,
    AlertCircle,
    Check,
    Heart,
    Mail as MailIcon,
    Facebook,
    Twitter,
    Linkedin,
    Share2,
    Minus,
    Plus,
    Search,
    Zap,
    Truck,
    ShoppingCart,
    Scan
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCart } from '../contexts/CartContext';
import { useSettings } from '../contexts/SettingsContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useChat } from '../contexts/ChatContext';
import { SupportTicketModal } from '../components/SupportTicketModal';

interface Product {
    id: string;
    name: string;
    description: string;
    base_price: number;
    images: string[];
    slug: string;
    vendor_id: string;
    stock_quantity: number;
    sales_count: number;
    views_count?: number;
    attributes?: {
        colors?: string[];
    };
    category: { name: string };
    vendor?: {
        id: string;
        shop_name: string;
        shop_logo_url: string;
        user_id: string;
        is_verified: boolean;
    };
}

interface ShippingMethod {
    id: string;
    name: string;
    display_name: string;
    base_cost: number;
    delivery_time_min: number;
    delivery_time_max: number;
}

interface Review {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    user: {
        full_name: string;
    };
}

export function ProductDetailsPage() {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const { calculatePrice, settings } = useSettings();
    const navigate = useNavigate();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const { openChat } = useChat();

    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [timeLeft, setTimeLeft] = useState({ days: 27, hrs: 4, mins: 38, secs: 9 });
    const [activeImage, setActiveImage] = useState(0);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
    const [showSupport, setShowSupport] = useState(false);

    const { addToCart } = useCart();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
                if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
                if (prev.hrs > 0) return { ...prev, hrs: prev.hrs - 1, mins: 59, secs: 59 };
                if (prev.days > 0) return { ...prev, days: prev.days - 1, hrs: 23, mins: 59, secs: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (slug) fetchProductData();
    }, [slug]);

    const fetchProductData = async () => {
        setLoading(true);
        try {
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select('*, category:categories(name), vendor:vendor_profiles(user_id, shop_name, shop_logo_url, is_verified)')
                .eq('slug', slug)
                .single();

            if (productError) throw productError;

            // Ensure vendor object exists even if RLS hides it or join fails
            if (productData && !productData.vendor) {
                // Try to recover vendor info if possible or just prevent crash
                console.warn('Vendor data missing for product', productData.id);
                productData.vendor = {
                    id: productData.vendor_id,
                    shop_name: 'Unknown Vendor',
                    shop_logo_url: '/placeholder.png',
                    user_id: '',
                    is_verified: false
                };
            }

            if (productData) {
                // Ensure images is an array
                if (!Array.isArray(productData.images)) {
                    productData.images = [];
                }
                setProduct(productData);

                // Increment views
                supabase.rpc('increment_product_views', { product_id: productData.id }).then(({ error }) => {
                    if (error) console.error('Error incrementing views:', error);
                });
                if (productData.attributes?.colors?.length > 0) {
                    setSelectedColor(productData.attributes.colors[0]);
                }



                // Fetch shipping methods
                const { data: shipping } = await supabase
                    .from('shipping_methods')
                    .select('*')
                    .eq('is_active', true);
                if (shipping) {
                    setShippingMethods(shipping);
                    // setSelectedShipping(shipping[0] || null); // Removed auto-select as per user request
                }

                // Fetch reviews
                const { data: reviewsData } = await supabase
                    .from('product_reviews')
                    .select('*, user:profiles(full_name)')
                    .eq('product_id', productData.id)
                    .order('created_at', { ascending: false });

                if (reviewsData) setReviews(reviewsData);
            }
        } catch (err: any) {
            console.error('Error fetching product:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleAddToCart = () => {
        if (!product) return;
        const calculated = calculatePrice(product.base_price);
        addToCart({
            id: product.id,
            name: product.name,
            price: calculated.total,
            base_price: product.base_price,
            quantity: quantity,
            image: product.images?.[0] || '',
            vendor: product.vendor?.shop_name || 'Vendor',
            vendor_id: product.vendor_id,
            options: {
                color: selectedColor,
                shipping: selectedShipping?.display_name
            }
        });
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    const handleStartChat = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (product) {
            openChat(product.vendor_id, product.vendor?.shop_name || 'Vendor');
        }
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const text = `Check out ${product?.name} on ZimAI!`;
        const shareUrls: Record<string, string> = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            mail: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
        };

        if (platform === 'share2' && navigator.share) {
            navigator.share({ title: text, url });
        } else if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        setSubmittingReview(true);
        setError(null);
        try {
            const { error: reviewError } = await supabase
                .from('product_reviews')
                .insert({
                    product_id: product?.id,
                    user_id: user.id,
                    rating: newRating,
                    comment: newComment
                });

            if (reviewError) throw reviewError;

            setSuccess(true);
            setNewComment('');
            setNewRating(5);
            fetchProductData(); // Refresh reviews

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4 transition-colors duration-300">
                <div className="text-center max-w-md">
                    <Package className="w-20 h-20 text-gray-200 dark:text-slate-800 mx-auto mb-6" />
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase mb-4">Product Not Found</h2>
                    <p className="text-gray-500 font-medium mb-8">This item is no longer available or the link is broken.</p>
                    <Link to="/products" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    const averageRating = reviews.length > 0
        ? reviews.reduce((acc, r: Review) => acc + r.rating, 0) / reviews.length
        : 5.0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20 transition-colors duration-300">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Images (4 cols) */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="aspect-square bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-sm rounded-lg overflow-hidden group relative">
                            {product.images && product.images.length > 0 && product.images[activeImage] ? (
                                <img
                                    src={product.images[activeImage]}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                    alt={product.name}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700">
                                    <Package className="w-20 h-20 text-gray-200 dark:text-slate-500" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-2 rounded-full cursor-pointer hover:bg-white dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-600 transition-all">
                                <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {product.images?.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`w-20 h-20 shrink-0 border-2 rounded-lg overflow-hidden transition-all ${activeImage === i ? 'border-orange-500 shadow-md ring-2 ring-orange-500/20' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt="" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle: Info (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Hot Deal Banner */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-[#6345FF] rounded overflow-hidden">
                                <span className="bg-[#5022FF] px-3 py-1 text-[10px] font-black italic text-white flex items-center gap-1">
                                    <Zap className="w-3 h-3 fill-white" /> HOT DEAL
                                </span>
                                <span className="px-3 py-1 text-[10px] font-bold text-white flex items-center gap-2">
                                    Ends In : <span className="font-black text-rose-300">
                                        {timeLeft.days} days : {timeLeft.hrs} hrs : {timeLeft.mins} mins : {timeLeft.secs} sec
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* Vendor Link */}
                        <Link to={`/shop/${product.vendor?.user_id}`} className="flex items-center gap-1.5 text-blue-500 hover:underline group">
                            <Store className="w-4 h-4" />
                            <span className="text-sm font-bold">{product.vendor?.shop_name || 'Unknown Vendor'}</span>
                            {product.vendor?.is_verified && (
                                <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center p-0.5">
                                    <Check className="w-2 h-2 text-white stroke-[4]" />
                                </div>
                            )}
                        </Link>

                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">{product.name}</h1>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-black text-orange-500 font-mono">
                                    {formatPrice(calculatePrice(product.base_price).total)}
                                </span>
                                <div className="flex-1 max-w-[180px] ml-4">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 italic mb-1">
                                        <span>{product.sales_count || 0} of {(product.sales_count || 0) + (product.stock_quantity || 0)} sold</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mb-2">
                                        <span>VAT & Handling Fees: {formatPrice(calculatePrice(product.base_price).vat + calculatePrice(product.base_price).commission)}</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner flex">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, Math.round(((product.sales_count || 0) / ((product.sales_count || 0) + (product.stock_quantity || 1))) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-gray-500">
                                <p>Availability: <span className={`${product.stock_quantity > 0 ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>{product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</span></p>
                                <p>Condition: <span className="text-gray-400 dark:text-gray-500 font-bold">New</span></p>
                            </div>

                            <div className="flex gap-6 text-[11px] font-bold text-blue-500 uppercase tracking-tight">
                                <button
                                    onClick={() => toggleWishlist(product.id)}
                                    className={`flex items-center gap-1.5 hover:underline transition-all ${isInWishlist(product.id) ? 'text-rose-500' : ''}`}
                                >
                                    <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-rose-500' : ''}`} /> {isInWishlist(product.id) ? 'Wishlisted' : 'Add to wishlist'}
                                </button>
                                <button
                                    onClick={() => handleStartChat()}
                                    className="flex items-center gap-1.5 hover:underline transition-all text-emerald-600"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" /> Chat with Seller
                                </button>
                                <button
                                    onClick={() => setShowSupport(true)}
                                    className="flex items-center gap-1.5 hover:underline transition-all text-rose-500"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" /> Support
                                </button>
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                            {[
                                { icon: Facebook, key: 'facebook' },
                                { icon: Twitter, key: 'twitter' },
                                { icon: Share2, key: 'share2' },
                                { icon: Linkedin, key: 'linkedin' },
                                { icon: MailIcon, key: 'mail' }
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleShare(item.key)}
                                    className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer transition-colors"
                                >
                                    <item.icon className="w-3.5 h-3.5" />
                                </div>
                            ))}
                            <div className="ml-auto flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                <Scan className="w-3 h-3" /> {product.views_count || 0} Viewers
                            </div>
                        </div>

                        {/* Options */}
                        {product.attributes?.colors && product.attributes.colors.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-gray-50 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-black text-gray-500 uppercase">Color:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {product.attributes.colors.map((color, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-7 h-7 rounded-lg border-2 p-0.5 transition-all ${selectedColor === color ? 'border-orange-500 shadow-sm' : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'}`}
                                            >
                                                <div className="w-full h-full rounded shadow-inner" style={{ backgroundColor: color }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Shipping & Dynamics */}
                        <div className="space-y-4 pt-4 border-t border-dashed border-gray-200 dark:border-slate-700">
                            <div className="flex items-start gap-4">
                                <span className="text-xs font-black text-gray-500 uppercase mt-1">Shipping:</span>
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-1 gap-2">
                                        {shippingMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedShipping(method)}
                                                className={`p-3 rounded-xl border-2 text-left transition-all group ${selectedShipping?.id === method.id
                                                    ? 'border-orange-500 bg-orange-50/30 dark:bg-orange-950/20'
                                                    : 'border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-gray-800 dark:text-gray-200">{method.display_name}</span>
                                                    <span className="text-xs font-black text-orange-500">{formatPrice(method.base_cost)}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold italic">Estimated: {method.delivery_time_min}-{method.delivery_time_max} Days</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-gray-500 uppercase">Quantity:</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded overflow-hidden">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-r border-gray-100 dark:border-slate-700"
                                        >
                                            <Minus className="w-3 h-3 text-gray-400" />
                                        </button>
                                        <input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                                            className="w-10 text-center text-xs font-black bg-transparent text-gray-900 dark:text-white focus:outline-none"
                                        />
                                        <button
                                            onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                                            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-l border-gray-100 dark:border-slate-700"
                                        >
                                            <Plus className="w-3 h-3 text-gray-400" />
                                        </button>
                                    </div>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold italic tracking-tight">{product.stock_quantity} in stock</span>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-slate-800 mt-4">
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    <span>Subtotal:</span>
                                    <span>{formatPrice(calculatePrice(product.base_price).total * quantity)}</span>
                                </div>
                                {settings?.is_enabled && (
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                                        <span>Includes VAT ({settings.default_rate}%):</span>
                                        <span>{formatPrice(calculatePrice(product.base_price).vat * quantity)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    <span>Shipping:</span>
                                    <span className={selectedShipping ? "text-gray-900 dark:text-gray-200" : "text-orange-500 font-bold"}>
                                        {selectedShipping ? formatPrice(selectedShipping.base_cost) : 'Select Shipping'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800">
                                    <span className="text-sm font-black text-gray-900 dark:text-gray-200 uppercase">Total:</span>
                                    <span className="text-2xl font-black text-emerald-600 font-mono">
                                        {formatPrice((calculatePrice(product.base_price).total * quantity) + (selectedShipping?.base_cost || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 pt-6">
                            <button
                                onClick={handleBuyNow}
                                className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-black uppercase text-xs shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                            >
                                <Zap className="w-4 h-4 fill-white animate-pulse" /> Buy Now
                            </button>
                            <button
                                onClick={handleAddToCart}
                                className={`flex items-center justify-center gap-3 py-3 rounded-lg font-black uppercase text-xs shadow-lg active:scale-[0.98] transition-all ${addedToCart
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                                    }`}
                            >
                                <ShoppingCart className="w-4 h-4" /> {addedToCart ? 'In Cart' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Vendor Side (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center group">
                            <div className="flex w-full items-center justify-between mb-6">
                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Sold by</span>
                                <button className="flex items-center gap-1 text-[10px] font-black text-blue-500 hover:underline">
                                    <Scan className="w-3 h-3" /> Quick View
                                </button>
                            </div>

                            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 border-2 border-gray-200 dark:border-slate-700 group-hover:border-orange-500 transition-all p-1 bg-white dark:bg-slate-700">
                                <img src={product.vendor?.shop_logo_url || '/placeholder.png'} className="w-full h-full object-cover rounded-xl" alt="" />
                            </div>

                            <Link to={`/shop/${product.vendor?.user_id}`} className="flex items-center gap-1.5 mb-2 hover:text-orange-600 transition-colors text-center">
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{product.vendor?.shop_name || 'Unknown Vendor'}</h4>
                                {product.vendor?.is_verified && (
                                    <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center p-0.5">
                                        <Check className="w-2 h-2 text-white stroke-[4]" />
                                    </div>
                                )}
                            </Link>

                            <div className="flex gap-0.5 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-orange-400 stroke-[2.5]" />
                                ))}
                            </div>

                            <button
                                onClick={handleStartChat}
                                className="w-full mt-4 flex items-center justify-center gap-3 bg-white dark:bg-slate-700 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 py-3 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all active:scale-[0.98]"
                            >
                                <MessageCircle className="w-4 h-4" /> Chat with Vendor
                            </button>
                        </div>

                        {/* Extra Sidebar Info (Optional) */}
                        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-slate-700 pb-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Checkout
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                <Truck className="w-4 h-4 text-blue-500" /> Fast Delivery
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="mt-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-1">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">Customer Feedback</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-8">Real experiences from our community.</p>

                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm mb-6">
                                <div className="text-center mb-6">
                                    <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{averageRating.toFixed(1)}</div>
                                    <div className="flex justify-center gap-1 mb-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-200 dark:text-gray-600'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{reviews.length} Verified Reviews</p>
                                </div>

                                <div className="space-y-3">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = reviews.filter((r: Review) => r.rating === star).length;
                                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-4">
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 w-2 shrink-0">{star}</span>
                                                <div className="flex-1 h-1.5 bg-gray-50 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                </div>
                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 w-6 shrink-0 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add Review Form */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-900/30 shadow-xl shadow-emerald-900/5">
                                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2 text-sm">
                                    <MessageCircle className="w-4 h-4 text-emerald-600" /> Share Thoughts
                                </h3>
                                {!user ? (
                                    <div className="text-center py-2">
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-2">Sign in to leave a review</p>
                                        <Link to="/login" className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Sign In Now</Link>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmitReview} className="space-y-4">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block text-center">Your Rating</label>
                                            <div className="flex justify-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setNewRating(star)}
                                                        className={`p-1 transition-all ${newRating >= star ? 'scale-110' : 'opacity-30 hover:opacity-100'}`}
                                                    >
                                                        <Star className={`w-6 h-6 ${newRating >= star ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <textarea
                                                required
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="Write your review..."
                                                rows={3}
                                                className="w-full bg-gray-100 dark:bg-slate-900 border border-transparent rounded-xl p-4 text-xs font-medium text-gray-900 dark:text-gray-200 focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                            />
                                        </div>
                                        {error && (
                                            <div className="bg-red-50 text-red-600 text-[8px] font-bold p-3 rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> {error}
                                            </div>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submittingReview}
                                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2 ${success
                                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                : submittingReview
                                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-400'
                                                    : 'bg-gray-900 dark:bg-slate-700 text-white hover:bg-emerald-600'
                                                }`}
                                        >
                                            {success ? (
                                                <><Check className="w-3 h-3" /> Shared</>
                                            ) : submittingReview ? (
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Send className="w-3 h-3" /> Post</>
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
                                    <MessageCircle className="w-12 h-12 text-gray-100 dark:text-slate-700 mx-auto mb-4" />
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Be the First</h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest">No reviews posted yet.</p>
                                </div>
                            ) : (
                                reviews.map((review: Review) => (
                                    <div key={review.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 uppercase text-sm">
                                                    {review.user?.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-xs">{review.user?.full_name || 'Verified User'}</h5>
                                                    <p className="text-[8px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">
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
            {/* Support Modal */}
            {showSupport && user && (
                <SupportTicketModal userId={user.id} onClose={() => setShowSupport(false)} />
            )}


            {/* Sticky Mobile Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 px-4 z-40 lg:hidden safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3">
                    <button
                        onClick={handleStartChat}
                        className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-emerald-600 transition-colors"
                    >
                        <MessageCircle className="w-5 h-5 mb-0.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Chat</span>
                    </button>
                    <div className="h-auto w-px bg-gray-100 mx-1"></div>
                    <button
                        onClick={handleAddToCart}
                        className={`flex-1 py-3 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all ${addedToCart
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-white border-2 border-orange-500 text-orange-500 active:bg-orange-50'
                            }`}
                    >
                        {addedToCart ? 'In Cart' : 'Add to Cart'}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-[#FF7F01] hover:bg-[#e67300] text-white py-3 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
}
