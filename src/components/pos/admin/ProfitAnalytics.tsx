import { useState } from 'react';
import { useDailyAnalytics, useAnalyticsSummary, useTrendData } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, TrendingUp, DollarSign, ShoppingCart, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';

export const ProfitAnalytics = () => {
  const [timelineType, setTimelineType] = useState<'7' | '30' | '90'>('30');
  
  const { data: dailyAnalytics = [], isLoading: analyticsLoading } = useDailyAnalytics();
  const { data: summary = {}, isLoading: summaryLoading } = useAnalyticsSummary(parseInt(timelineType));
  const { data: trendData = [], isLoading: trendLoading } = useTrendData(parseInt(timelineType));

  const isLoading = analyticsLoading || summaryLoading || trendLoading;

  // Filter data based on timeline
  const filteredDailyData = dailyAnalytics.slice(0, parseInt(timelineType));

  // Prepare chart data
  const chartData = trendData
    .filter(d => d.order_date)
    .map(d => ({
      date: new Date(d.order_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: d.total_revenue || 0,
      profit: d.total_profit || 0,
      orders: d.total_orders || 0,
    }));

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${(summary.totalRevenue || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Profit',
      value: `$${(summary.totalProfit || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: summary.totalOrders || 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
    },
    {
      title: 'Completed Orders',
      value: summary.completedOrders || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Timeline Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Profit Analytics</h2>
        <Select value={timelineType} onValueChange={(value) => setTimelineType(value as '7' | '30' | '90')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Profit/Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary.avgProfitPerOrder || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average per completed order</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Highest Order</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary.highestOrderProfit || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Highest profit in period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalOrders > 0
                    ? ((summary.cancelledOrders / summary.totalOrders) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">{summary.cancelledOrders} cancelled</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {chartData.length > 0 && (
            <>
              {/* Revenue vs Profit Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Profit Trend</CardTitle>
                  <CardDescription>Daily revenue and profit over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="profit"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders and Profit */}
              <Card>
                <CardHeader>
                  <CardTitle>Orders and Profit</CardTitle>
                  <CardDescription>Daily order count and profit amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="orders"
                        fill="#f97316"
                        name="Orders"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="profit"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Profit ($)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Daily Breakdown Table */}
          {filteredDailyData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
                <CardDescription>Detailed daily performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Date</th>
                        <th className="text-right py-2 px-2">Orders</th>
                        <th className="text-right py-2 px-2">Revenue</th>
                        <th className="text-right py-2 px-2">Profit</th>
                        <th className="text-right py-2 px-2">Avg/Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDailyData.map((day, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">
                            {day.order_date ? new Date(day.order_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="text-right py-2 px-2">{day.total_orders || 0}</td>
                          <td className="text-right py-2 px-2">
                            ${(day.total_revenue || 0).toFixed(2)}
                          </td>
                          <td className="text-right py-2 px-2 font-semibold text-green-600">
                            ${(day.total_profit || 0).toFixed(2)}
                          </td>
                          <td className="text-right py-2 px-2">
                            ${(day.avg_profit_per_order || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
