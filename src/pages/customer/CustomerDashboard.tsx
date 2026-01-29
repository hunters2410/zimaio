import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Wallet,
  Heart,
  Settings,
  LogOut,
  ShoppingBag,
  Clock,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Search,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

type TabType = 'overview' | 'orders' | 'refunds' | 'wallet' | 'favorites' | 'settings';

export function CustomerDashboard() {
  const { profile, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    walletBalance: 0,
    favoriteItems: 0
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, walletRes, refundsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .eq('customer_id', profile?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', profile?.id)
          .maybeSingle(),
        supabase
          .from('order_refunds')
          .select('*, orders(order_number)')
          .eq('customer_id', profile?.id)
          .order('created_at', { ascending: false })
      ]);

      const allOrders = ordersRes.data || [];
      const allRefunds = refundsRes.data || [];
      const pendingCount = allOrders.filter(o => ['pending', 'processing'].includes(o.status)).length;

      setOrders(allOrders);
      setRefunds(allRefunds);
      setStats({
        totalOrders: allOrders.length,
        pendingOrders: pendingCount,
        walletBalance: walletRes.data?.balance || 0,
        favoriteItems: 0
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
        ? isDark
          ? 'bg-cyan-900/40 text-cyan-400 font-semibold shadow-sm'
          : 'bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-800 font-semibold shadow-sm'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:fixed top-[80px] lg:top-[184px] left-0 z-40 w-72 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-[calc(100vh-80px)] lg:h-[calc(100vh-184px)]`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
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
            <SidebarItem id="refunds" icon={RotateCcw} label="Refunds" />
            <SidebarItem id="wallet" icon={Wallet} label="My Wallet" />
            <SidebarItem id="favorites" icon={Heart} label="Favorites" count={stats.favoriteItems} />
            <SidebarItem id="settings" icon={Settings} label="Settings" />
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-700 mt-auto">
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4 mb-4 flex items-center gap-3 border border-gray-100 dark:border-slate-700">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-700 dark:text-cyan-400 font-bold text-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 p-3 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-72">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-[80px] lg:top-[184px] z-30 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between lg:justify-end transition-all">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <Link to="/products" className="bg-gray-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-slate-600 transition shadow-sm border border-transparent dark:border-slate-600">
              Browse Products
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0]}!</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Here's what's happening with your account today.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats Cards */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full uppercase tracking-widest">Total</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.totalOrders}</div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Orders placed</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full uppercase tracking-widest">Pending</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.pendingOrders}</div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Orders in progress</p>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                        <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full uppercase tracking-widest">Balance</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">${stats.walletBalance.toFixed(2)}</div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Available funds</p>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-lg">Recent Orders</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 uppercase tracking-widest"
                    >
                      View All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {orders.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-700 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">No orders found</p>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                          <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Total</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase">
                                #{order.order_number}
                              </td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-black text-gray-900 dark:text-white hidden md:table-cell">
                                ${order.total}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Link to={`/orders/${order.id}`} className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 uppercase tracking-widest">
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">My Orders</h2>
                  <div className="relative group w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="SEARCH ORDER NUMBER..."
                      value={orderSearch}
                      onChange={(e) => {
                        setOrderSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-cyan-500/5 focus:border-cyan-500/50 transition-all placeholder:text-gray-300 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {orders
                          .filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase()))
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors group">
                              <td className="px-6 py-5 font-black text-gray-900 dark:text-white uppercase group-hover:text-cyan-600 transition-colors">#{order.order_number}</td>
                              <td className="px-6 py-5 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-5 font-black text-gray-900 dark:text-white tabular-nums">${order.total}</td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-right">
                                <Link to={`/orders/${order.id}`} className="p-2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all inline-block hover:scale-110 active:scale-95">
                                  <ArrowRight className="w-5 h-5" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {(orders.length === 0 || orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length === 0) ? (
                    <div className="p-20 text-center animate-in fade-in duration-700">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-12 transition-transform">
                        <Package className="w-10 h-10 text-gray-200 dark:text-slate-700" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">No orders found</h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-8">Try adjusting your search or start shopping.</p>
                      <Link to="/products" className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-800 dark:hover:bg-gray-100 transition shadow-xl active:scale-95">
                        Start Shopping <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="px-6 py-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-900/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        SHOWING <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> TO <span className="text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length)}</span> OF <span className="text-gray-900 dark:text-white">{orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length}</span> ENTRIES
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length / itemsPerPage) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all active:scale-95 ${currentPage === i + 1
                                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length / itemsPerPage)}
                          className="p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'refunds' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">My Refunds</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase">
                            #{refund.orders?.order_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase max-w-xs truncate" title={refund.reason}>{refund.reason}</td>
                          <td className="px-6 py-4 font-black text-gray-900 dark:text-white">${refund.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${refund.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                              refund.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase">
                            {new Date(refund.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {refunds.length === 0 && (
                    <div className="p-12 text-center">
                      <RotateCcw className="w-16 h-16 mx-auto text-gray-200 dark:text-slate-700 mb-4" />
                      <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">No refunds found</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">My Wallet</h2>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Manage your funds and transactions</p>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-white/5 group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Wallet className="w-32 h-32" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/80 mb-2">Available Balance</p>
                  <div className="text-5xl font-black tracking-tighter mb-10">${stats.walletBalance.toFixed(2)}</div>
                  <div className="flex gap-4 relative z-10">
                    <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-white/10">Top Up</button>
                    <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-cyan-900/40">History</button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-700 p-8 text-center">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Transaction history feature coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Profile Settings</h2>
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-gray-100 dark:border-slate-700 shadow-sm p-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
                      <input type="text" disabled value={profile?.full_name || ''} className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
                      <input type="email" disabled value={profile?.email || ''} className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                      <input type="text" disabled value={profile?.phone || 'Not set'} className="w-full px-5 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-900 dark:text-white font-bold text-sm" />
                    </div>

                    <div className="pt-6 border-t border-gray-100 dark:border-slate-700">
                      <button disabled className="px-8 py-3 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed">Save Changes</button>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-widest">Editing profile is currently disabled in this demo.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Heart className="w-20 h-20 mx-auto text-gray-200 dark:text-slate-800 mb-6" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Your Favorites</h2>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-2">You haven't saved any items yet.</p>
                <Link to="/products" className="mt-8 inline-block bg-cyan-600 dark:bg-cyan-500 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-700 transition shadow-xl shadow-cyan-900/40">Browse Shop</Link>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
