import { supabase } from '../lib/supabase';

export interface DailyStats {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_vendors: number;
  new_customers: number;
  new_vendors: number;
  new_products: number;
}

export interface OrderTrend {
  date: string;
  hour: number;
  order_count: number;
  total_value: number;
}

export interface VendorPerformance {
  vendor_id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  total_products_sold: number;
  average_rating: number;
}

export interface ProductView {
  product_id: string;
  date: string;
  view_count: number;
  unique_visitors: number;
}

export const analyticsService = {
  async getDailyStats(days: number = 30): Promise<DailyStats[]> {
    const { data, error } = await supabase
      .from('analytics_daily_stats')
      .select('*')
      .order('date', { ascending: true })
      .limit(days);

    if (error) throw error;
    return data || [];
  },

  async getRevenueGrowth(days: number = 30) {
    const stats = await this.getDailyStats(days);
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Number(stat.total_revenue),
      orders: stat.total_orders
    }));
  },

  async getCustomerGrowth(days: number = 30) {
    const stats = await this.getDailyStats(days);
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: stat.total_customers,
      new: stat.new_customers
    }));
  },

  async getVendorGrowth(days: number = 30) {
    const stats = await this.getDailyStats(days);
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: stat.total_vendors,
      new: stat.new_vendors
    }));
  },

  async getOrderTrends(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('analytics_order_trends')
      .select('*')
      .eq('date', targetDate)
      .order('hour', { ascending: true });

    if (error) throw error;

    return (data || []).map(trend => ({
      hour: `${trend.hour}:00`,
      orders: trend.order_count,
      value: Number(trend.total_value)
    }));
  },

  async getTopVendors(limit: number = 10) {
    const { data, error } = await supabase
      .from('analytics_vendor_performance')
      .select(`
        vendor_id,
        total_revenue,
        total_orders,
        vendor_profiles (
          business_name,
          user_id
        )
      `)
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getSalesComparison(days: number = 7) {
    const stats = await this.getDailyStats(days);
    return stats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      orders: stat.total_orders,
      revenue: Number(stat.total_revenue),
      customers: stat.new_customers
    }));
  },

  async getProductCategoryDistribution() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        category_id,
        categories (name)
      `);

    if (error) throw error;

    const distribution: Record<string, number> = {};
    (data || []).forEach((product: any) => {
      const categoryName = product.categories?.name || 'Uncategorized';
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value
    }));
  },

  async getOrderStatusDistribution() {
    const { data, error } = await supabase
      .from('orders')
      .select('status');

    if (error) throw error;

    const distribution: Record<string, number> = {};
    (data || []).forEach((order: any) => {
      distribution[order.status] = (distribution[order.status] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }
};
