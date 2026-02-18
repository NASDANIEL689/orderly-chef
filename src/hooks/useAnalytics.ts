import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyAnalytics {
  order_date: string | null;
  total_orders: number | null;
  completed_orders: number | null;
  cancelled_orders: number | null;
  total_subtotal: number | null;
  total_tax: number | null;
  total_revenue: number | null;
  total_profit: number | null;
  avg_profit_per_order: number | null;
  highest_order_profit: number | null;
  lowest_order_profit: number | null;
}

export interface AnalyticsSummary {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalProfit: number;
  avgProfitPerOrder: number;
  highestOrderProfit: number;
  lowestOrderProfit: number;
}

export type TimelineType = 'daily' | 'weekly' | 'monthly' | 'all';

export const useDailyAnalytics = () => {
  return useQuery({
    queryKey: ['daily-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .order('order_date', { ascending: false });
      
      if (error) throw error;
      
      return (data || []) as DailyAnalytics[];
    },
  });
};

export const useAnalyticsSummary = (days: number = 30) => {
  return useQuery({
    queryKey: ['analytics-summary', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('daily_analytics')
        .select('*')
        .gte('order_date', startDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      const analytics = (data || []) as DailyAnalytics[];
      
      // Calculate summary from analytics data
      const summary: AnalyticsSummary = {
        totalOrders: analytics.reduce((sum, a) => sum + (a.total_orders || 0), 0),
        completedOrders: analytics.reduce((sum, a) => sum + (a.completed_orders || 0), 0),
        cancelledOrders: analytics.reduce((sum, a) => sum + (a.cancelled_orders || 0), 0),
        totalRevenue: analytics.reduce((sum, a) => sum + (a.total_revenue || 0), 0),
        totalTax: analytics.reduce((sum, a) => sum + (a.total_tax || 0), 0),
        totalProfit: analytics.reduce((sum, a) => sum + (a.total_profit || 0), 0),
        avgProfitPerOrder: analytics.length > 0
          ? analytics.reduce((sum, a) => sum + (a.avg_profit_per_order || 0), 0) / analytics.length
          : 0,
        highestOrderProfit: Math.max(
          ...analytics.map(a => a.highest_order_profit || 0)
        ),
        lowestOrderProfit: Math.min(
          ...analytics.map(a => a.lowest_order_profit || 0)
        ),
      };
      
      return summary;
    },
  });
};

export const useTrendData = (days: number = 30) => {
  return useQuery({
    queryKey: ['trend-data', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('daily_analytics')
        .select('order_date, total_revenue, total_profit, total_orders')
        .gte('order_date', startDate.toISOString().split('T')[0])
        .order('order_date', { ascending: true });
      
      if (error) throw error;
      
      return (data || []) as Array<{
        order_date: string | null;
        total_revenue: number | null;
        total_profit: number | null;
        total_orders: number | null;
      }>;
    },
  });
};
