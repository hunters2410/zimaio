import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, ArrowRight, Store, X, ShieldCheck, Search, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  images: any[];
  vendor_id: string;
  is_featured: boolean;
  category?: {
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

interface VendorShop {
  id: string;
  shop_name: string;
  shop_description: string;
  shop_logo_url: string | null;
  shop_banner_url: string | null;
  user_id: string;
  is_verified: boolean;
  rating: number;
}

interface VendorAd {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  ad_type: 'banner' | 'sidebar' | 'popup' | 'featured';
}



interface HomeSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  button_text: string;
  is_active: boolean;
}

export function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [vendorShops, setVendorShops] = useState<VendorShop[]>([]);
  const [activeAds, setActiveAds] = useState<VendorAd[]>([]);
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>([]);
  const [popupAd, setPopupAd] = useState<VendorAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (homeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [homeSlides.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, vendorsRes, adsRes, slidesRes] = await Promise.all([
          supabase
            .from('products')
            .select('*, category:categories(slug)')
            .eq('is_active', true)
            .limit(8),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .limit(12),
          supabase
            .from('vendor_profiles')
            .select('*')
            .limit(6),
          supabase
            .from('vendor_ads')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString())
            .gte('end_date', new Date().toISOString()),
          supabase
            .from('home_slides')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
        ]);

        if (productsRes.data) setFeaturedProducts(productsRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (vendorsRes.data) setVendorShops(vendorsRes.data);
        if (slidesRes.data) setHomeSlides(slidesRes.data);

        if (adsRes.data) {
          setActiveAds(adsRes.data);

          // Find a popup ad
          const popup = adsRes.data.find(ad => ad.ad_type === 'popup');
          if (popup) {
            const hasShown = sessionStorage.getItem(`shown_popup_${popup.id}`);
            if (!hasShown) {
              setPopupAd(popup);
              sessionStorage.setItem(`shown_popup_${popup.id}`, 'true');
            }
          }

          // Record Impressions (Non-blocking)
          const adIds = adsRes.data.map(ad => ad.id);
          if (adIds.length > 0) {
            supabase.rpc('increment_ad_impressions', { ad_ids: adIds }).then(({ error }) => {
              if (error) console.error('Error recording impressions:', error);
            });
          }
        }
      } catch (err) {
        console.error('HomePage data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const handleAdClick = async (adId: string) => {
    // Record click
    await supabase.rpc('increment_ad_clicks', { ad_id: adId });
  };

  return (
    <div className="min-h-screen transition-colors duration-300 dark:bg-slate-900">
      {homeSlides.length > 0 && (
        <section className="relative h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
          {homeSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
              <img
                src={slide.image_url}
                alt={slide.title}
                loading={index === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 inset-y-0 z-20 flex flex-col items-center justify-center text-center px-4 md:px-20 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-1000">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] font-bold uppercase tracking-[0.3em] rounded-full mb-4 shadow-lg">New Collections</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight uppercase tracking-tight mb-4 drop-shadow-2xl">{slide.title}</h2>
                <p className="text-base md:text-lg text-white/90 font-medium mb-8 max-w-2xl leading-relaxed drop-shadow-md">{slide.subtitle}</p>
                <Link
                  to={slide.link_url}
                  className="px-8 py-3 bg-white text-gray-900 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-green-50 transition-all flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 group"
                >
                  {slide.button_text} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {homeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-12 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'
                  }`}
              />
            ))}
          </div>
        </section>
      )}

      <section className="py-24 bg-[#FAFAFA] dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 animate-fade-in-up">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Vendors</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Verified professional sellers you can trust</p>
            </div>
            <Link to="/vendors" className="text-green-600 font-bold flex items-center group">
              Explore All Shops
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4 md:pb-0 scrollbar-hide animate-fade-in-up-delay-1">
              {vendorShops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.user_id}`}
                  className="min-w-[280px] md:min-w-0 snap-center group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                >
                  <div className="h-24 bg-gray-100 dark:bg-slate-700 relative overflow-hidden">
                    {shop.shop_banner_url ? (
                      <img src={shop.shop_banner_url} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={shop.shop_name} />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                        <Store className="w-8 h-8 text-emerald-200 dark:text-emerald-800" />
                      </div>
                    )}
                    {shop.is_verified && (
                      <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-0 relative flex-grow flex flex-col text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white dark:bg-slate-700 p-1 rounded-xl shadow-lg -mt-6 relative z-10 border border-gray-50 dark:border-slate-600 flex items-center justify-center overflow-hidden transition-transform group-hover:rotate-3">
                        {shop.shop_logo_url ? (
                          <img src={shop.shop_logo_url} loading="lazy" className="w-full h-full object-cover rounded-lg" alt="" />
                        ) : (
                          <Store className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="mt-2 flex-1 min-w-0">
                        <h3 className="text-xs font-black text-gray-900 dark:text-white leading-none group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">{shop.shop_name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                          <span className="text-[8px] font-black text-gray-400 dark:text-gray-500">{(shop.rating || 5.0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 text-[10px] font-medium line-clamp-2 leading-relaxed opacity-80">
                      {shop.shop_description || "Premium marketplace vendor offering quality goods."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section >

      <section className="py-20 bg-[#FAFAFA] dark:bg-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in-up">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">Featured Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-tight">Handpicked premium items for you</p>
            </div>
            <Link to="/products" className="text-blue-600 text-sm font-bold flex items-center group">
              View Collection
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-48 md:h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 pb-4 md:pb-0 scrollbar-hide animate-fade-in-up-delay-2">
              {featuredProducts.map((product) => (
                <div key={product.id} className="min-w-[160px] md:min-w-0 snap-center premium-card group bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 relative">
                  <Link to={`/products/${product.slug}`} className="block">
                    <div className="h-40 md:h-48 bg-gray-100 dark:bg-slate-700 overflow-hidden relative group-hover:bg-gray-50 dark:group-hover:bg-slate-600 transition-colors">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700 text-gray-200 dark:text-slate-600">
                          <ShoppingBag className="h-12 w-12" />
                        </div>
                      )}
                      {product.is_featured && (
                        <div className="absolute top-2 left-2 py-1 px-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full text-[9px] font-bold uppercase tracking-wider text-gray-900 dark:text-white shadow-sm z-10">
                          Featured
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all z-10 ${isInWishlist(product.id) ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/80 dark:bg-slate-800/80 text-gray-400 hover:text-rose-500 border border-gray-100 dark:border-slate-700'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </Link>

                  <div className="p-3 md:p-4 flex flex-col gap-2">
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="font-bold text-gray-900 dark:text-white text-xs md:text-sm mb-1 line-clamp-2 leading-relaxed hover:text-blue-600 transition-colors tracking-tight">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-end justify-between mt-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Price</span>
                        <span className="text-sm md:text-lg font-extrabold text-blue-600 dark:text-blue-400 font-sans">
                          ${product.base_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">4.8</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: product.id,
                            name: product.name,
                            price: product.base_price,
                            image: product.images?.[0] || '',
                            vendor_id: product.vendor_id,
                            vendor: 'ZimAIO Vendor',
                            base_price: product.base_price,
                            quantity: 1
                          });
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product.category?.slug) {
                            navigate(`/products?category=${product.category.slug}`);
                          }
                        }}
                        className="py-2 px-3 bg-gray-100 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white text-gray-600 dark:text-gray-300 rounded-lg transition-all duration-300 flex items-center justify-center active:scale-95"
                        title="Find Similar"
                      >
                        <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>



      {
        activeAds.find(ad => ad.ad_type === 'featured') && (
          <section className="py-12 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="container mx-auto px-4">
              {activeAds.filter(ad => ad.ad_type === 'featured').slice(0, 1).map(ad => (
                <a
                  key={ad.id}
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAdClick(ad.id)}
                  className="block relative rounded-[2rem] overflow-hidden group shadow-2xl hover:shadow-purple-900/20 transition-all duration-700"
                >
                  <div className="aspect-[21/9] md:aspect-[25/7] relative">
                    <img src={ad.image_url} alt={ad.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-center p-8 md:p-16">
                      <div className="max-w-xl text-white">
                        <span className="inline-block px-4 py-1 rounded-full bg-purple-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg animate-pulse">Special Offer</span>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight drop-shadow-lg">{ad.title}</h2>
                        <button className="bg-white text-gray-900 px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-purple-600 hover:text-white transition-all shadow-xl active:scale-95">Discover More</button>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )
      }

      <section className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300" >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">Curated Categories</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Browse by your areas of interest</p>
            </div>
            <Link to="/categories" className="text-green-600 font-bold flex items-center group">
              Browse All
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-3xl h-40 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 animate-fade-in-up-delay-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-8 hover:bg-green-600 dark:hover:bg-green-600 group transition-all duration-500 text-center hover:shadow-2xl hover:shadow-green-900/40 relative overflow-hidden"
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 overflow-hidden relative z-10">
                    {category.image_url ? (
                      <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors text-sm uppercase tracking-widest relative z-10">{category.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section >


      <section className="py-24 bg-gray-900 dark:bg-slate-950 text-white relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-green-500/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Empower Your Business <br /> with ZimAIO.</h2>
          <p className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Join ZimAIO's curated ecosystem. Reach meaningful customers and scale your shop with professional tools.
          </p>
          <Link
            to="/vendor-signup"
            className="premium-button bg-green-600 text-white hover:bg-green-700 shadow-2xl shadow-green-900/40 inline-flex"
          >
            Open Your Shop Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {
        popupAd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative max-w-lg w-full bg-white dark:bg-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 delay-200 border border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setPopupAd(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <a
                href={popupAd.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { handleAdClick(popupAd!.id); setPopupAd(null); }}
                className="block group"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img src={popupAd.image_url} alt={popupAd.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                    <span className="inline-block self-start px-3 py-1 bg-green-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full mb-4">Limited Event</span>
                    <h3 className="text-3xl font-black text-white mb-4 leading-tight uppercase tracking-tight">{popupAd.title}</h3>
                    <div className="flex items-center gap-2 text-white/80 font-bold uppercase tracking-widest text-[10px]">
                      Explore Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        )
      }
    </div >
  );
}
