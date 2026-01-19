import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Wallet, Heart, MessageCircle, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function CustomerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    walletBalance: 0,
    favoriteItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;

      const [ordersRes, walletRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profile.id)
          .maybeSingle()
      ]);

      const orders = ordersRes.data || [];
      const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status)).length;

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        walletBalance: walletRes.data?.balance || 0,
        favoriteItems: 0
      });

      setRecentOrders(orders);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.full_name}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            to="/orders"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-cyan-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.totalOrders}</div>
            <p className="text-sm text-gray-600">Total Orders</p>
            {stats.pendingOrders > 0 && (
              <p className="text-xs text-cyan-600 mt-2">{stats.pendingOrders} pending</p>
            )}
          </Link>

          <Link
            to="/wallet"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              ${stats.walletBalance.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">Wallet Balance</p>
          </Link>

          <Link
            to="/favorites"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.favoriteItems}</div>
            <p className="text-sm text-gray-600">Saved Items</p>
          </Link>

          <Link
            to="/messages"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">0</div>
            <p className="text-sm text-gray-600">Messages</p>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-3">
              <Link
                to="/orders"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <Package className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">My Orders</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">Profile Settings</span>
              </Link>
              <Link
                to="/support"
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <HelpCircle className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700">Support Tickets</span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No orders yet</p>
                <Link
                  to="/products"
                  className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-cyan-300 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.total}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
