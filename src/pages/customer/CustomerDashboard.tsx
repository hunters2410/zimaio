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
  ArrowRight,
  ShieldCheck
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
    <div className="flex min-h-screen bg-[#FAFAFA] dark:bg-slate-950 font-roboto">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 lg:top-[184px] left-0 z-40 w-72 bg-white dark:bg-slate-800 border-r border-gray-100 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-screen lg:h-[calc(100vh-184px)]`}>
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-cyan-500/20">
                Z
              </div>
              <div>
                <h1 className="font-black text-slate-900 dark:text-white text-lg leading-none tracking-tighter">ZimAIO</h1>
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
      <main className="flex-1 flex flex-col lg:ml-72 w-full max-w-[100vw] overflow-x-hidden">
        {/* Portal Header - Simplified, no longer sticky to avoid overlap clutter */}
        <header className="px-6 py-6 flex items-center justify-between lg:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 rounded-xl shadow-sm"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">

            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Theme-aware Welcome Banner */}
                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-10 overflow-hidden group border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/5 dark:from-cyan-500/10 to-transparent pointer-events-none" />
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-600/5 dark:bg-cyan-600/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">Active Session</span>
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
                        WELCOME BACK,<br />
                        <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                          {profile?.full_name?.toUpperCase().split(' ')[0]}
                        </span>
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-sm leading-relaxed">
                        Here's a quick look at your account summary for today.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Link to="/products" className="group/btn relative px-5 sm:px-6 py-2.5 sm:py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:scale-105 transition-all overflow-hidden flex items-center justify-center gap-2">
                        <span className="relative z-10">Start Shopping</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                      <button onClick={fetchData} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Stats Cards - Resized to average size */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                          <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">Activity</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stats.totalOrders}</div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Lifetime Orders</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-100 dark:border-amber-800">Processing</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">{stats.pendingOrders}</div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Active Shipments</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 p-3 rounded-xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">Funds</span>
                      </div>
                      <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums">${stats.walletBalance.toFixed(2)}</div>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Available Balance</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Table */}
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-cyan-600 rounded-full" />
                      <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base">Recent Transactions</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-[9px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 uppercase tracking-widest bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-lg transition-all"
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
                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Order</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Date</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Total</th>
                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-4 sm:px-6 py-4 font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm">
                                #{order.order_number}
                              </td>
                              <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase hidden sm:table-cell">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-black text-slate-900 dark:text-white hidden md:table-cell">
                                ${order.total}
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-right">
                                <Link to={`/orders/${order.id}`} className="text-[9px] sm:text-[10px] font-black text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 uppercase tracking-widest">
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
                          <th className="px-4 sm:px-6 py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Order</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Date</th>
                          <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Total</th>
                          <th className="px-4 sm:px-6 py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
                          <th className="px-4 sm:px-6 py-5 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {orders
                          .filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase()))
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors group">
                              <td className="px-4 sm:px-6 py-5 font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm group-hover:text-cyan-600 transition-colors">#{order.order_number}</td>
                              <td className="px-6 py-5 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase hidden sm:table-cell">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="px-6 py-5 font-black text-slate-900 dark:text-white tabular-nums hidden md:table-cell">${order.total}</td>
                              <td className="px-4 sm:px-6 py-5">
                                <span className={`inline-flex items-center px-1.5 sm:px-3 py-1 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest border transition-all ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-5 text-right">
                                <Link to={`/orders/${order.id}`} className="p-1 sm:p-2 text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all inline-block hover:scale-110 active:scale-95">
                                  <ArrowRight className="w-4 h-4 sm:w-5 h-5" />
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
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        SHOWING <span className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> TO <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length)}</span> OF <span className="text-slate-900 dark:text-white">{orders.filter(order => order.order_number.toLowerCase().includes(orderSearch.toLowerCase())).length}</span> ENTRIES
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
                        <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Order</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Reason</th>
                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Amount</th>
                        <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right sm:text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {refunds.map((refund) => (
                        <tr key={refund.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 font-black text-slate-900 dark:text-white uppercase text-xs sm:text-sm">
                            #{refund.orders?.order_number || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase max-w-xs truncate hidden sm:table-cell" title={refund.reason}>{refund.reason}</td>
                          <td className="px-6 py-4 font-black text-slate-900 dark:text-white hidden md:table-cell">${refund.amount}</td>
                          <td className="px-4 sm:px-6 py-4 text-[8px] sm:text-sm">
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest border ${refund.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                              refund.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                              }`}>
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-gray-600 dark:text-gray-400 font-bold text-[10px] sm:text-xs uppercase text-right sm:text-left">
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
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">My Wallet</h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage your funds and transactions</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 md:p-10 text-slate-900 dark:text-white shadow-sm relative overflow-hidden border border-slate-100 dark:border-slate-800 group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Wallet className="w-32 h-32" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400 mb-2">Available Balance</p>
                    <div className="text-5xl font-black tracking-tighter mb-10 text-slate-900 dark:text-white tabular-nums">${stats.walletBalance.toFixed(2)}</div>
                    <div className="flex gap-4">
                      <button className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-lg">Top Up Account</button>
                      <button className="flex-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 active:scale-95">Withdraw</button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center transition-colors">
                  <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Transaction history feature coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-cyan-600 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Profile Settings</h2>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm p-8 md:p-10">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Full Name</label>
                        <input type="text" disabled value={profile?.full_name || ''} className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm cursor-not-allowed" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Email Address</label>
                        <input type="email" disabled value={profile?.email || ''} className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm cursor-not-allowed" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Phone Number</label>
                      <input type="text" disabled value={profile?.phone || 'Not set'} className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold text-sm cursor-not-allowed" />
                    </div>

                    <div className="pt-8 border-t border-slate-50 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button disabled className="w-full sm:w-auto px-8 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-not-allowed">Save Profile</button>
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Editing is locked in demo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-slate-200 dark:text-slate-800" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Your Favorites</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">You haven't saved any items yet.</p>
                <Link to="/products" className="mt-8 inline-flex items-center gap-3 bg-cyan-600 dark:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-700 hover:scale-105 transition-all shadow-xl shadow-cyan-900/20 active:scale-95">
                  Explore Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
