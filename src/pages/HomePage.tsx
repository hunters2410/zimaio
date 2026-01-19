import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Shield, Headphones, Star, ArrowRight, Store } from 'lucide-react';
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
}

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendorShops, setVendorShops] = useState<VendorShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroImages = [
    'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1229861/pexels-photo-1229861.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/3766111/pexels-photo-3766111.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1920',
    'https://images.pexels.com/photos/1148399/pexels-photo-1148399.jpeg?auto=compress&cs=tinysrgb&w=1920'
  ];

  useEffect(() => {
    const fetchData = async () => {
      const [productsRes, categoriesRes, vendorsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
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
          .eq('is_verified', true)
          .eq('is_featured', true)
          .eq('is_approved', true)
          .limit(6)
      ]);

      if (productsRes.data) setFeaturedProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (vendorsRes.data) setVendorShops(vendorsRes.data);
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="min-h-screen">
      <section className="relative h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <img
              src={image}
              alt={`Hero ${index + 1}`}
              className="w-full h-full object-cover scale-105"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 leading-[1.1] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              Find Exceptional <br /> Products Daily.
            </h1>
            <p className="text-lg md:text-xl mb-10 text-white/90 font-medium max-w-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
              Experience Zimbabwe's most refined marketplace. Verified vendors, premium quality, delivered to you.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="premium-button bg-green-600 text-white hover:bg-green-700 shadow-xl shadow-green-900/20"
              >
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/vendor-signup"
                className="premium-button bg-white/10 backdrop-blur-md text-white border border-white/30 hover:bg-white/20 transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-10 right-10 z-20 hidden md:flex space-x-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? 'bg-white w-10' : 'bg-white/30 w-4 hover:bg-white/50'
                }`}
            />
          ))}
        </div>
      </section>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vendorShops.map((shop) => (
                <Link
                  key={shop.id}
                  to={`/vendor/${shop.user_id}`}
                  className="premium-card group"
                >
                  <div className="h-40 bg-gray-100 overflow-hidden relative">
                    {shop.shop_banner_url ? (
                      <img
                        src={shop.shop_banner_url}
                        alt={shop.shop_name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-green-50">
                        <Store className="h-20 w-20 text-green-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-8 pt-0 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-xl -mt-10 relative z-10 flex items-center justify-center border border-gray-100 transition-transform group-hover:scale-105">
                        {shop.shop_logo_url ? (
                          <img
                            src={shop.shop_logo_url}
                            alt={shop.shop_name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <Store className="h-10 w-10 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 mt-4">
                        <h3 className="font-bold text-gray-900 text-xl mb-1 group-hover:text-green-600 transition-colors uppercase tracking-tight">{shop.shop_name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed tracking-tight">{shop.shop_description}</p>
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
                  to={`/category/${category.slug}`}
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

      <section className="py-24 bg-[#FAFAFA]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Editor's Picks</h2>
              <p className="text-gray-500 font-medium tracking-tight">Handpicked premium items for you</p>
            </div>
            <Link to="/products" className="text-green-600 font-bold flex items-center group">
              View Collection
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-96 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="premium-card group"
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
    </div>
  );
}
