import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Shield, Headphones, Star, ArrowRight, Store, X, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  images: any[];
  vendor_id: string;
  is_featured: boolean;
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

interface Brand {
  id: string;
  name: string;
  logo_url: string;
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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
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
        const [productsRes, categoriesRes, vendorsRes, brandsRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .limit(8),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .limit(6),
          supabase
            .from('vendor_profiles')
            .select('*')
            //.eq('is_approved', true) 
            .limit(6),
          supabase
            .from('brands')
            .select('*')
            .eq('is_active', true)
            .limit(8)
        ]);

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (vendorsRes.error) throw vendorsRes.error;

        if (productsRes.data) setFeaturedProducts(productsRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (vendorsRes.data) setVendorShops(vendorsRes.data);
        if (brandsRes.data) setBrands(brandsRes.data);

        // Fetch Active Ads (Optional, don't block)
        const { data: adsData, error: adsError } = await supabase
          .from('vendor_ads')
          .select('*')
          .eq('status', 'active')
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString());

        if (!adsError && adsData) {
          setActiveAds(adsData);

          // Find a popup ad
          const popup = adsData.find(ad => ad.ad_type === 'popup');
          if (popup) {
            // Check if already shown in this session
            const hasShown = sessionStorage.getItem(`shown_popup_${popup.id}`);
            if (!hasShown) {
              setPopupAd(popup);
              sessionStorage.setItem(`shown_popup_${popup.id}`, 'true');
            }
          }

          // Fetch Home Slides
          const { data: slidesData } = await supabase
            .from('home_slides')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          if (slidesData) setHomeSlides(slidesData);

          // Record Impressions
          const adIds = adsData.map(ad => ad.id);
          if (adIds.length > 0) {
            await supabase.rpc('increment_ad_impressions', { ad_ids: adIds });
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
    <div className="min-h-screen">
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

      <section className="py-24 bg-[#FAFAFA]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Vendors</h2>
              <p className="text-gray-500 font-medium tracking-tight">Verified professional sellers you can trust</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {vendorShops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/shop/${shop.user_id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-1 flex flex-col"
                >
                  <div className="h-24 bg-gray-100 relative overflow-hidden">
                    {shop.shop_banner_url ? (
                      <img src={shop.shop_banner_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={shop.shop_name} />
                    ) : (
                      <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                        <Store className="w-8 h-8 text-emerald-200" />
                      </div>
                    )}
                    {shop.is_verified && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                        <span className="text-[7px] font-black text-emerald-900 uppercase tracking-widest">Verified</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-0 relative flex-grow flex flex-col text-left">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white p-1 rounded-xl shadow-lg -mt-6 relative z-10 border border-gray-50 flex items-center justify-center overflow-hidden transition-transform group-hover:rotate-3">
                        {shop.shop_logo_url ? (
                          <img src={shop.shop_logo_url} className="w-full h-full object-cover rounded-lg" alt="" />
                        ) : (
                          <Store className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="mt-2 flex-1 min-w-0">
                        <h3 className="text-xs font-black text-gray-900 leading-none group-hover:text-emerald-600 transition-colors uppercase tracking-tight truncate">{shop.shop_name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-2 h-2 text-yellow-500 fill-yellow-500" />
                          <span className="text-[8px] font-black text-gray-400">{(shop.rating || 5.0).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-500 text-[10px] font-medium line-clamp-2 leading-relaxed opacity-80">
                      {shop.shop_description || "Premium marketplace vendor offering quality goods."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-[#FAFAFA]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">Featured Products</h2>
              <p className="text-sm text-gray-500 font-medium tracking-tight">Handpicked premium items for you</p>
            </div>
            <Link to="/products" className="text-green-600 text-sm font-bold flex items-center group">
              View Collection
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="premium-card group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="h-64 bg-gray-100 overflow-hidden relative">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-200">
                        <ShoppingBag className="h-20 w-20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 py-1.5 px-3 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-900 shadow-lg">
                      Featured
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 leading-tight group-hover:text-green-600 transition-colors uppercase tracking-tight">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Price</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${product.base_price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
                        <span className="ml-1.5 text-sm font-extrabold text-yellow-700">4.8</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 border-y border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: ShoppingBag, title: 'Wide Selection', desc: 'Premium products only' },
              { icon: Shield, title: 'Secure Checkout', desc: 'Encrypted transactions' },
              { icon: TrendingUp, title: 'Best Value', desc: 'Competitive market rates' },
              { icon: Headphones, title: 'Expert Support', desc: 'Daily 24/7 assistance' }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="bg-green-50 p-6 rounded-3xl mb-6 transition-all group-hover:bg-green-600 group-hover:shadow-2xl group-hover:shadow-green-900/40">
                  <feature.icon className="h-10 w-10 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2 tracking-tight">{feature.title}</h3>
                <p className="text-gray-400 text-sm font-medium tracking-tight">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeAds.find(ad => ad.ad_type === 'featured') && (
        <section className="py-12 bg-white">
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
                  <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
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
      )}

      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Curated Categories</h2>
              <p className="text-gray-500 font-medium tracking-tight">Browse by your areas of interest</p>
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
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.slug}`}
                  className="bg-gray-50 rounded-3xl p-8 hover:bg-green-600 group transition-all duration-500 text-center hover:shadow-2xl hover:shadow-green-900/40"
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-white transition-colors text-sm uppercase tracking-widest">{category.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>


      <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-24 -mr-24 w-96 h-96 bg-green-500/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 bg-green-500/10 blur-[100px] rounded-full" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Empower Your Business <br /> with ZimAIO.</h2>
          <p className="text-lg mb-12 text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Join ZimAIO's curated ecosystem. Reach meaningful customers and scale your boutique with professional tools.
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

      {popupAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative max-w-lg w-full bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 delay-200">
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
      )}
    </div>
  );
}
