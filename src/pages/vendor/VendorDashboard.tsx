import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, DollarSign, ShoppingCart, TrendingUp, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { VendorCurrencyManagement } from './VendorCurrencyManagement';

export function VendorDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    walletBalance: 0,
    rating: 0
  });
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const { data: vendor } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (vendor) {
        setVendorProfile(vendor);

        const [ordersRes, productsRes, walletRes] = await Promise.all([
          supabase
            .from('orders')
            .select('total, status')
            .eq('vendor_id', vendor.id),
          supabase
            .from('products')
            .select('id')
            .eq('vendor_id', vendor.id),
          supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', profile.id)
            .maybeSingle()
        ]);

        const orders = ordersRes.data || [];
        const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        setStats({
          totalSales,
          totalOrders: orders.length,
          totalProducts: productsRes.data?.length || 0,
          pendingOrders,
          walletBalance: walletRes.data?.balance || 0,
          rating: vendor.rating || 0
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Vendor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            It looks like your vendor profile hasn't been set up yet. Please complete your vendor registration.
          </p>
          <Link
            to="/vendor/setup"
            className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
          >
            Complete Setup
          </Link>
        </div>
      </div>
    );
  }

  if (!vendorProfile.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your vendor account is currently under review. We'll notify you once it's approved.
            This usually takes 1-2 business days.
          </p>
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Complete your KYC verification if you haven't already</li>
              <li>• Set up your shop profile with logo and banner</li>
              <li>• Prepare your product listings</li>
              <li>• Configure shipping zones and rates</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {vendorProfile.shop_name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-cyan-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-cyan-600" />
              </div>
              <span className="text-sm text-gray-500">Total Sales</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.totalSales.toFixed(2)}
            </div>
            <p className="text-sm text-cyan-600 mt-2">
              <TrendingUp className="inline h-4 w-4" /> +12% from last month
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Orders</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
            <p className="text-sm text-gray-500 mt-2">{stats.pendingOrders} pending orders</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Total Products</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
            <Link to="/vendor/products" className="text-sm text-purple-600 mt-2 inline-block hover:underline">
              Manage products
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Wallet Balance</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ${stats.walletBalance.toFixed(2)}
            </div>
            <Link to="/vendor/wallet" className="text-sm text-green-600 mt-2 inline-block hover:underline">
              Manage wallet
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Shop Rating</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.rating.toFixed(1)}</div>
            <p className="text-sm text-gray-500 mt-2">Based on customer reviews</p>
          </div>

          <div className="bg-gradient-to-r from-cyan-600 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/vendor/products/new" className="block text-sm hover:underline">
                + Add New Product
              </Link>
              <Link to="/vendor/orders" className="block text-sm hover:underline">
                View Orders
              </Link>
              <Link to="/vendor/promotions" className="block text-sm hover:underline">
                Create Promotion
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <VendorCurrencyManagement />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="text-center py-8 text-gray-500">
              No recent orders
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">KYC Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendorProfile.kyc_status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : vendorProfile.kyc_status === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {vendorProfile.kyc_status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Account Status</span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Commission Rate</span>
                <span className="text-gray-900 font-medium">{vendorProfile.commission_rate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
