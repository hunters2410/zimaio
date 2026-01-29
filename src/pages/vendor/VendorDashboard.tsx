import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Archive,
  CreditCard,
  Store,
  AlertCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  MessageCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { VendorCurrencyManagement } from './VendorCurrencyManagement';
import { VendorLayout } from '../../components/VendorLayout';
import { VendorSettings } from './VendorSettings';
import { VendorProductManagement } from './VendorProductManagement';
import { VendorOrderManagement } from './VendorOrderManagement';
import { VendorPackageManagement } from './VendorPackageManagement';
import { VendorPOS } from './VendorPOS';
import { VendorKYC } from './VendorKYC';
import { VendorRefundManagement } from './VendorRefundManagement';
import { VendorAdsManagement } from './VendorAdsManagement';
import { VendorReports } from './VendorReports';
import { VendorChat } from './VendorChat';

type TabType = 'overview' | 'products' | 'orders' | 'wallet' | 'settings' | 'packages' | 'pos' | 'kyc' | 'refunds' | 'ads' | 'reports' | 'messages';

export function VendorDashboard() {
  const { profile, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(currentTab);
  const [loading, setLoading] = useState(true);

  // Sync state with URL
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    const [tabName, query] = tab.split('?');
    setActiveTab(tabName as TabType);
    const params: any = { tab: tabName };
    if (query) {
      const queryParams = new URLSearchParams(query);
      queryParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    setSearchParams(params);
  };

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    walletBalance: 0,
    rating: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    dailyRevenue: [] as any[],
    unreadMessages: 0
  });

  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const fetchData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // 1. Get Vendor Profile
      const { data: vendor, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (vendor) {
        setVendorProfile(vendor);

        // 2. Get Subscription & Features
        const { data: subscription } = await supabase
          .from('vendor_subscriptions')
          .select('*, vendor_packages(*)')
          .eq('vendor_id', profile.id)
          .maybeSingle();

        // 3. Get Related Data
        const [ordersRes, productsRes, walletRes] = await Promise.all([
          supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', vendor.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('products')
            .select('*')
            .eq('vendor_id', vendor.id),
          supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', profile.id)
            .maybeSingle()
        ]);

        const orders = ordersRes.data || [];
        const products = productsRes.data || [];

        // Map package info if available
        if (subscription?.vendor_packages) {
          setVendorProfile((prev: any) => prev ? {
            ...prev,
            vendor_packages: subscription.vendor_packages
          } : null);
        }
        const totalSales = orders
          .filter(o => o.status !== 'cancelled')
          .reduce((sum: number, order: any) => sum + Number(order.total), 0);

        const pendingOrders = orders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length;
        const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10).length;
        const outOfStock = products.filter(p => p.stock_quantity === 0).length;

        // Process Daily Revenue for Charts
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const processedChartData: Record<string, number> = {};
        orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).forEach((order: any) => {
          const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          processedChartData[date] = (processedChartData[date] || 0) + Number(order.total);
        });

        setStats({
          totalSales,
          totalOrders: orders.length,
          totalProducts: products.length,
          pendingOrders,
          walletBalance: walletRes.data?.balance || 0,
          rating: vendor.rating || 0,
          lowStockItems: lowStock,
          outOfStockItems: outOfStock,
          dailyRevenue: Object.entries(processedChartData).map(([date, total]) => ({ date, total })),
          unreadMessages: (await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false)
            .neq('sender_id', profile.id)
            .in('conversation_id', (
              await supabase
                .from('chat_conversations')
                .select('id')
                .contains('participant_ids', [profile.id])
            ).data?.map(c => c.id) || [])).count || 0
        });

        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching vendor data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
  }, [profile?.id]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Handle No Profile (Unapproved or new)
  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-slate-800">
          <Store className="w-16 h-16 mx-auto text-emerald-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vendor Setup Required</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Your vendor profile is not fully set up. Please complete your registration to access the dashboard.</p>
          <Link to="/vendor/setup" className="block w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/20 active:scale-95">
            Complete Setup
          </Link>
          <button onClick={signOut} className="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm">
            Sign Out
          </button>
        </div>
      </div>
    );
  }


  return (
    <VendorLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      shopName={vendorProfile?.shop_name}
      hasPosAccess={
        vendorProfile?.vendor_packages?.has_pos_access ||
        (Array.isArray(vendorProfile?.vendor_packages) && vendorProfile.vendor_packages[0]?.has_pos_access)
      }
    >
      <div className="max-w-6xl mx-auto pb-10">
        {/* Header Action - Only show on relevant tabs */}


        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Dashboard Overview</h2>
                <p className="text-xs text-gray-500 mt-1">Snapshot of your shop's performance and inventory health.</p>
              </div>

              {/* KYC Reminder Banner */}
              {vendorProfile?.kyc_status !== 'approved' && vendorProfile?.kyc_status !== 'pending' && (
                <div className="flex-1 max-w-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
                  <div className="flex items-center gap-3 text-blue-800 dark:text-blue-400">
                    <ShieldCheck size={20} className="shrink-0" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider">KYC Verification Required</p>
                      <p className="text-[10px] font-bold opacity-80">Submit your documents to unlock full platform trust and faster payouts.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTabChange('kyc')}
                    className="whitespace-nowrap bg-blue-800 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    Submit Now
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button onClick={fetchData} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">
                  <Package className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleTabChange('products?add=true')}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>
            </div>

            {/* Quick Alerts */}
            {(stats.lowStockItems > 0 || stats.outOfStockItems > 0 || stats.pendingOrders > 0 || stats.unreadMessages > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.unreadMessages > 0 && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">Unaddressed Inbox</p>
                      <p className="text-xs font-bold text-rose-900">{stats.unreadMessages} Unread messages</p>
                    </div>
                    <button onClick={() => handleTabChange('messages')} className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline whitespace-nowrap">Reply</button>
                  </div>
                )}
                {stats.pendingOrders > 0 && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Attention Required</p>
                      <p className="text-xs font-bold text-blue-900">{stats.pendingOrders} Orders need processing</p>
                    </div>
                    <button onClick={() => handleTabChange('orders')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline whitespace-nowrap">View</button>
                  </div>
                )}
                {stats.lowStockItems > 0 && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1">Stock Warning</p>
                      <p className="text-xs font-bold text-amber-900">{stats.lowStockItems} Items running low</p>
                    </div>
                    <button onClick={() => handleTabChange('products')} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline whitespace-nowrap">Restock</button>
                  </div>
                )}
                {stats.outOfStockItems > 0 && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                      <Archive className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Critical Alert</p>
                      <p className="text-xs font-bold text-red-900">{stats.outOfStockItems} Products out of stock</p>
                    </div>
                    <button onClick={() => handleTabChange('products')} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline whitespace-nowrap">Check</button>
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Gross Revenue</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{stats.totalOrders}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Lifetime Orders</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                    <Archive className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">{stats.totalProducts}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Active Catalog</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10">
                  <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                    <CreditCard className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 tracking-tight tabular-nums">${stats.walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Withdrawable Funds</p>
                </div>
              </div>
            </div>

            {/* Performance Visualization */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Financial Performance</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue trend for the past 30 days</p>
                </div>
                <button onClick={() => handleTabChange('reports')} className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">
                  View Full Report <TrendingUp className="w-3 h-3" />
                </button>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyRevenue}>
                    <defs>
                      <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#dashboardRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Orders Table */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">Recent Orders</h3>
                  </div>
                  <button onClick={() => handleTabChange('orders')} className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest">See All Orders</button>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/30">
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-[11px] font-bold text-gray-400 uppercase">No recent transactions</td>
                        </tr>
                      ) : (
                        recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-black text-gray-900 tabular-nums group-hover:text-emerald-600 transition-colors uppercase">#{order.order_number}</div>
                              <div className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{new Date(order.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black text-gray-900 tabular-nums">${order.total}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full inline-block">Active</div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shop Insights / Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 text-gray-900 shadow-xl shadow-gray-200 relative overflow-hidden border border-gray-100">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Store className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Shop Profile</h3>
                    <p className="text-xs text-gray-500 font-medium mb-6">Your store's visibility: <span className="text-emerald-500 font-black">HIGH</span></p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Support Rating</span>
                        <span className="text-sm font-black text-emerald-600">{stats.rating.toFixed(1)}/5.0</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Join Date</span>
                        <span className="text-xs font-bold text-gray-900">{new Date(vendorProfile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTabChange('settings')}
                      className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200"
                    >
                      Edit Shop Profile
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-100">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4">Quick Tip</h4>
                  <p className="text-xs text-emerald-900 font-bold leading-relaxed italic">
                    "Updating your product stock regularly helps improve your visibility in customer search results."
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && <VendorCurrencyManagement />}
        {activeTab === 'products' && <VendorProductManagement />}
        {activeTab === 'orders' && <VendorOrderManagement />}
        {activeTab === 'settings' && <VendorSettings />}
        {activeTab === 'packages' && <VendorPackageManagement />}
        {activeTab === 'pos' && <VendorPOS onTabChange={handleTabChange} />}
        {activeTab === 'kyc' && <VendorKYC />}
        {activeTab === 'refunds' && <VendorRefundManagement />}
        {activeTab === 'ads' && <VendorAdsManagement onTabChange={handleTabChange} />}
        {activeTab === 'reports' && <VendorReports />}
        {activeTab === 'messages' && <VendorChat />}
      </div>
    </VendorLayout>
  );
}
