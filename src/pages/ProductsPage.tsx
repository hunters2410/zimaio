import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Star, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCurrency } from '../contexts/CurrencyContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  currency_code: string;
  images: any[];
  vendor_id: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-600">Browse our entire collection</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                  <input type="range" className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>$0</span>
                    <span>$1000+</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Rating</h4>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300" />
                        <div className="ml-2 flex items-center">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                          <span className="ml-1 text-sm text-gray-600">& up</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                {products.length} products found
              </p>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
                <option>Best Rating</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className="bg-white rounded-lg shadow-sm hover:shadow-lg transition overflow-hidden group"
                  >
                    <div className="h-48 bg-gray-200 overflow-hidden">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-cyan-600">
                          {formatPrice(product.base_price, product.currency_code || 'USD')}
                        </span>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">4.5</span>
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
