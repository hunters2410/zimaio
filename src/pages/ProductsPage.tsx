import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Filter, Search, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  currency_code: string;
  images: string[];
  vendor_id: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface VendorAd {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sidebarAd, setSidebarAd] = useState<VendorAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const { formatPrice } = useCurrency();
  const { calculatePrice } = useSettings();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      const [productsRes, categoriesRes, adsRes] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .order('name'),
        supabase
          .from('vendor_ads')
          .select('*')
          .eq('status', 'active')
          .eq('ad_type', 'sidebar')
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString())
          .limit(1)
          .maybeSingle()
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
        // If there's a category slug in URL, find its ID
        if (categorySlug) {
          const cat = categoriesRes.data.find(c => c.slug === categorySlug);
          if (cat) setSelectedCategory(cat.id);
        }
      }
      if (productsRes.data) setProducts(productsRes.data);
      if (adsRes.data) {
        setSidebarAd(adsRes.data);
        await supabase.rpc('increment_ad_impressions', { ad_ids: [adsRes.data.id] });
      }
      setLoading(false);
    };

    fetchContent();
  }, [categorySlug]);

  const handleCategoryClick = (categoryId: string | null, slug?: string) => {
    setSelectedCategory(categoryId);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const searchQuery = searchParams.get('search');

  const filteredProducts = products.filter(p => {
    // 1. Filter by Category
    if (selectedCategory && p.category_id !== selectedCategory) {
      return false;
    }
    // 2. Filter by Search Query (Deep Search)
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const searchWords = query.split(/\s+/).filter(w => w.length > 0);

      return searchWords.every(word => {
        // Search in Name
        if (p.name.toLowerCase().includes(word)) return true;

        // Search in Slug (often contains semantic keywords)
        if (p.slug && p.slug.toLowerCase().includes(word)) return true;

        // Search in Description (if available)
        if ((p as any).description && (p as any).description.toLowerCase().includes(word)) return true;

        // Search in Tags (if tags exists as array or string)
        if ((p as any).tags) {
          if (Array.isArray((p as any).tags)) {
            if ((p as any).tags.some((t: string) => t.toLowerCase().includes(word))) return true;
          } else if (typeof (p as any).tags === 'string') {
            if ((p as any).tags.toLowerCase().includes(word)) return true;
          }
        }

        // Search in Category Name (if we could map it, but we only have category_id on product currently)
        // We could assume user might search 'Electronics' which is a category. 
        // Ideally we join category name, but let's stick to product fields for now. 

        return false;
      });
    }
    return true;
  });

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleAdClick = async (adId: string) => {
    await supabase.rpc('increment_ad_clicks', { ad_id: adId });
  };

  const handleFindSimilar = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      handleCategoryClick(category.id, category.slug);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">All Products</h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Browse our entire collection</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                Filters & Categories
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <aside className={`lg:w-64 space-y-6 lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                  Filter by Category
                </h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
                  <ChevronDown className="h-4 w-4 rotate-180" />
                </button>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find a category..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                />
              </div>

              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => { handleCategoryClick(null); setShowFilters(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === null
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  All Products
                </button>
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { handleCategoryClick(category.id, category.slug); setShowFilters(false); }}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === category.id
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
                {filteredCategories.length === 0 && (
                  <p className="text-[10px] font-black uppercase text-gray-400 text-center py-4">No categories found</p>
                )}
              </div>
            </div>

            {sidebarAd && (
              <a
                href={sidebarAd.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleAdClick(sidebarAd.id)}
                className="block bg-white p-2 rounded-xl shadow-sm border border-gray-100 group overflow-hidden"
              >
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-3">
                  <img src={sidebarAd.image_url} alt={sidebarAd.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-white text-[8px] font-black uppercase tracking-widest">Sponsored</div>
                </div>
                <h4 className="font-bold text-gray-900 text-sm line-clamp-1 px-2 mb-1 uppercase tracking-tight">{sidebarAd.title}</h4>
                <p className="text-[10px] text-green-600 font-black px-2 uppercase tracking-widest">Shop Now</p>
              </a>
            )}
          </aside>

          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                {filteredProducts.length} Premium results found
              </p>
              <select className="px-4 py-2 border border-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
                <option>Best Rating</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse border border-gray-50"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.slug}`}
                    className="group bg-white rounded-3xl border border-gray-100 p-3 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 hover:-translate-y-1"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="px-1 pb-1">
                      <h3 className="text-[11px] font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-1 uppercase tracking-tight mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-2">
                        <span className="text-sm font-black text-emerald-600">
                          {formatPrice(calculatePrice(product.base_price).total, product.currency_code || 'USD')}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleFindSimilar(product.category_id);
                            }}
                            title="Find similar products"
                            className="p-1 px-2 border border-gray-100 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          >
                            <Search className="h-3 w-3" />
                          </button>
                          <div className="p-1 px-2 border border-gray-100 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <ShoppingBag className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
