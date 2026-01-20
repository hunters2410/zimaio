import { useEffect, useState } from 'react';
import { Users, Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { analyticsService } from '../../services/analyticsService';
import { RevenueChart } from '../../components/analytics/RevenueChart';
import { CustomerGrowthChart } from '../../components/analytics/CustomerGrowthChart';
import { OrderTrendsChart } from '../../components/analytics/OrderTrendsChart';
import { CategoryPieChart } from '../../components/analytics/CategoryPieChart';

export function AdminDashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingVendors: 0,
    pendingKyc: 0,
    fraudAlerts: 0
  });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    revenueGrowth: any[];
    customerGrowth: any[];
    orderTrends: any[];
    categoryDistribution: any[];
  }>({
    revenueGrowth: [],
    customerGrowth: [],
    orderTrends: [],
    categoryDistribution: []
  });

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600';

  useEffect(() => {
    const fetchStats = async () => {
      const [
        customersRes,
        vendorsRes,
        productsRes,
        ordersRes,
        pendingVendorsRes,
        pendingKycRes,
        fraudRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'vendor'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total'),
        supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('vendor_profiles').select('id', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('fraud_detections').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      const totalRevenue = (ordersRes.data || []).reduce((sum, order) => sum + Number(order.total), 0);

      setStats({
        totalCustomers: customersRes.count || 0,
        totalVendors: vendorsRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalRevenue,
        pendingVendors: pendingVendorsRes.count || 0,
        pendingKyc: pendingKycRes.count || 0,
        fraudAlerts: fraudRes.count || 0
      });

      setLoading(false);
    };

    const fetchAnalytics = async () => {
      try {
        const [revenue, customers, trends, categories] = await Promise.all([
          analyticsService.getRevenueGrowth(14),
          analyticsService.getCustomerGrowth(14),
          analyticsService.getOrderTrends(),
          analyticsService.getProductCategoryDistribution()
        ]);

        setAnalyticsData({
          revenueGrowth: revenue,
          customerGrowth: customers,
          orderTrends: trends,
          categoryDistribution: categories
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    fetchStats();
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Admin Dashboard</h1>
        <p className={`text-sm ${textSecondary}`}>Platform Overview & Management</p>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Customers</span>
            </div>
            <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalCustomers}</div>
            <p className="text-sm text-blue-600 mt-2">
              <TrendingUp className="inline h-4 w-4" /> Active users
            </p>
          </div>

          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <span className={`text-sm ${textSecondary}`}>Vendors</span>
            </div>
            <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalVendors}</div>
            <p className="text-sm text-yellow-600 mt-2">{stats.pendingVendors} pending approval</p>
          </div>

          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <span className={`text-sm ${textSecondary}`}>Products</span>
            </div>
            <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalProducts}</div>
            <p className={`text-sm ${textSecondary} mt-2`}>Listed on platform</p>
          </div>

          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="bg-cyan-100 p-3 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-cyan-600" />
              </div>
              <span className={`text-sm ${textSecondary}`}>Orders</span>
            </div>
            <div className={`text-3xl font-bold ${textPrimary}`}>{stats.totalOrders}</div>
            <p className="text-sm text-cyan-600 mt-2">Total orders placed</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-cyan-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8" />
              <span className="text-sm text-cyan-100">Platform Revenue</span>
            </div>
            <div className="text-4xl font-bold mb-2">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-cyan-100">Total transaction value</p>
          </div>

          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Pending Actions</h3>
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'} rounded-lg`}>
                <span className={`text-sm ${textSecondary}`}>Vendor Approvals</span>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-semibold">
                  {stats.pendingVendors}
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-lg`}>
                <span className={`text-sm ${textSecondary}`}>KYC Verifications</span>
                <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                  {stats.pendingKyc}
                </span>
              </div>
              <div className={`flex items-center justify-between p-3 ${isDark ? 'bg-red-900/30' : 'bg-red-50'} rounded-lg`}>
                <span className={`text-sm ${textSecondary}`}>Fraud Alerts</span>
                <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-semibold">
                  {stats.fraudAlerts}
                </span>
              </div>
            </div>
          </div>

          <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
            <h3 className={`text-base font-semibold ${textPrimary} mb-3`}>Quick Actions</h3>
            <div className="space-y-1.5">
              <Link to="/admin/vendors" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-green-900/20 text-green-400 hover:bg-green-900/40' : 'bg-green-50 text-green-700 hover:bg-green-100'} rounded-lg text-sm transition`}>
                Manage Vendors
              </Link>
              <Link to="/admin/kyc-verification" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'} rounded-lg text-sm transition`}>
                KYC Verification
              </Link>
              <Link to="/admin/roles-permissions" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-cyan-900/20 text-cyan-400 hover:bg-cyan-900/40' : 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'} rounded-lg text-sm transition`}>
                Roles & Permissions
              </Link>
              <Link to="/admin/orders" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'} rounded-lg text-sm transition`}>
                Orders Management
              </Link>
              <Link to="/admin/reports" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/40' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'} rounded-lg text-sm transition`}>
                Generate Reports
              </Link>
              <Link to="/admin/fraud-detection" className={`block w-full text-left px-3 py-2 ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-700 hover:bg-red-100'} rounded-lg text-sm transition`}>
                Fraud Detection
              </Link>
            </div>
          </div>
        </div>

        <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
          <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>System Alerts</h3>
          <div className="space-y-3">
            {stats.fraudAlerts > 0 && (
              <div className={`flex items-start space-x-3 p-4 ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg`}>
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-600">Fraud Alerts Pending Review</h4>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                    {stats.fraudAlerts} transaction(s) flagged for potential fraud. Review immediately.
                  </p>
                </div>
              </div>
            )}
            {stats.pendingVendors > 0 && (
              <div className={`flex items-start space-x-3 p-4 ${isDark ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}>
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-600">Vendor Applications Pending</h4>
                  <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                    {stats.pendingVendors} vendor application(s) waiting for approval.
                  </p>
                </div>
              </div>
            )}
            {stats.fraudAlerts === 0 && stats.pendingVendors === 0 && (
              <div className={`text-center py-8 ${textSecondary}`}>
                No alerts at this time. System running smoothly.
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className={`h-6 w-6 ${textPrimary}`} />
            <h2 className={`text-xl font-bold ${textPrimary}`}>Analytics & Insights</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
              <h3 className={`text-base font-semibold ${textPrimary} mb-4`}>Revenue & Orders (Last 14 Days)</h3>
              <RevenueChart data={analyticsData.revenueGrowth} />
            </div>

            <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
              <h3 className={`text-base font-semibold ${textPrimary} mb-4`}>Customer Growth (Last 14 Days)</h3>
              <CustomerGrowthChart data={analyticsData.customerGrowth} />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
              <h3 className={`text-base font-semibold ${textPrimary} mb-4`}>Today's Order Trends by Hour</h3>
              <OrderTrendsChart data={analyticsData.orderTrends} />
            </div>

            <div className={`${cardBg} rounded-lg shadow-sm p-6`}>
              <h3 className={`text-base font-semibold ${textPrimary} mb-4`}>Product Distribution by Category</h3>
              <CategoryPieChart data={analyticsData.categoryDistribution} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
