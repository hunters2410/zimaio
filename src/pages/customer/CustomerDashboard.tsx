import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Wallet,
  Heart,
  MessageCircle,
  Settings,
  LogOut,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Menu,
  X,
  Search,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type TabType = 'overview' | 'orders' | 'wallet' | 'favorites' | 'settings';

export function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    walletBalance: 0,
    favoriteItems: 0
  });

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, walletRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', profile?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profile?.id)
          .maybeSingle()
      ]);

      const allOrders = ordersRes.data || [];
      const pendingCount = allOrders.filter(o => ['pending', 'processing'].includes(o.status)).length;

      setOrders(allOrders);
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: pendingCount,
        walletBalance: walletRes.data?.balance || 0,
        favoriteItems: 0 // Placeholder as favorites table might needed
      });

    } catch (error) {
      console.error("Error fetching customer data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const SidebarItem = ({ id, icon: Icon, label, count }: { id: TabType, icon: any, label: string, count?: number }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setSidebarOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === id
          ? 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-800 font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-gray-50'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${activeTab === id ? 'text-cyan-600' : 'text-gray-400'}`} />
        <span>{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className="bg-cyan-100 text-cyan-800 text-xs font-bold px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/20">
                Z
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-none">ZimaShop</h1>
                <span className="text-xs text-cyan-600 font-medium">Customer Portal</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 flex-1">
            <SidebarItem id="overview" icon={ShoppingBag} label="Overview" />
            <SidebarItem id="orders" icon={Package} label="My Orders" count={stats.pendingOrders} />
            <SidebarItem id="wallet" icon={Wallet} label="My Wallet" />
            <SidebarItem id="favorites" icon={Heart} label="Favorites" count={stats.favoriteItems} />
            <SidebarItem id="settings" icon={Settings} label="Settings" />
          </div>

          <div className="pt-6 border-t border-gray-100 mt-auto">
            <div className="bg-gray-50 rounded-xl p-4 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-700 font-bold text-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 p-3 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <Link to="/products" className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-sm">
              Browse Products
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">

            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(' ')[0]}!</h2>
                  <p className="text-gray-500 mt-1">Here's what's happening with your account today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                    <p className="text-sm text-gray-500 mt-1">Orders placed</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</div>
                    <p className="text-sm text-gray-500 mt-1">Orders in progress</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                        <Wallet className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Balance</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">${stats.walletBalance.toFixed(2)}</div>
                    <p className="text-sm text-gray-500 mt-1">Available funds</p>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 text-lg">Recent Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {orders.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p>No orders found</p>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Total</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 font-medium text-gray-900">
                                #{order.order_number}
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900 hidden md:table-cell">
                                ${order.total}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <Link to={`/orders/${order.id}`} className="text-cyan-600 hover:text-cyan-700 text-sm font-medium">
                                  Details
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">My Orders</h2>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-medium text-gray-900">#{order.order_number}</td>
                          <td className="px-6 py-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 font-medium">${order.total}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/orders/${order.id}`} className="p-2 text-gray-400 hover:text-cyan-600 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="p-12 text-center">
                      <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                      <Link to="/products" className="text-cyan-600 hover:underline mt-2 inline-block">Start shopping</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="max-w-xl mx-auto space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">My Wallet</h2>
                  <p className="text-gray-500">Manage your funds and transactions</p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Wallet className="w-32 h-32" />
                  </div>
                  <p className="text-gray-400 mb-2 font-medium">Available Balance</p>
                  <div className="text-4xl font-bold mb-8">${stats.walletBalance.toFixed(2)}</div>
                  <div className="flex gap-4">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-sm py-2 rounded-lg font-medium transition-colors">Top Up</button>
                    <button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors border border-transparent">History</button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">Transaction history feature coming soon.</p>
                </div>
              </div>
            )}

            {activeTab === 'profile' || activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" disabled value={profile?.full_name || ''} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input type="email" disabled value={profile?.email || ''} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="text" disabled value={profile?.phone || 'Not set'} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500" />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button disabled className="px-6 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed">Save Changes</button>
                      <p className="text-xs text-gray-400 mt-2">Editing profile is currently disabled in this demo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Your Favorites</h2>
                <p className="text-gray-500 mt-2">You haven't saved any items yet.</p>
                <Link to="/products" className="mt-6 inline-block bg-cyan-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-cyan-700 transition">Browse Shop</Link>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
