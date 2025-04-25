import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Calendar,
  Clock,
  ArrowUp,
  ArrowDown,
  Target,
  ShoppingCart,
  Package,
  Activity,
} from "lucide-react";
import { getSellerOrders } from "@/api/seller";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = {
  vip: "#FF6B6B",
  regular: "#4ECDC4",
  occasional: "#45B7D1",
};

const SEGMENT_DESCRIPTIONS = {
  vip: "5+ orders or ₱10,000+ spent",
  regular: "2-4 orders or ₱5,000+ spent",
  occasional: "1 order",
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className = "",
}) => (
  <div
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {trend !== undefined && (
        <div
          className={`flex items-center px-2 py-1 rounded-full text-sm ${
            trend >= 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {trend >= 0 ? (
            <ArrowUp className="w-3 h-3 mr-1" />
          ) : (
            <ArrowDown className="w-3 h-3 mr-1" />
          )}
          <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
        </div>
      )}
    </div>
    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
    <div className="flex flex-col">
      <p className="text-gray-600 font-medium">{title}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  </div>
);

const CustomerSegmentCard = ({
  segment,
  count,
  revenue,
  total,
  description,
}) => (
  <div className="flex items-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
    <div
      className={`w-2 h-12 rounded-full mr-4`}
      style={{ backgroundColor: COLORS[segment.toLowerCase()] }}
    />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-lg font-semibold text-gray-900">{segment}</h4>
        <span className="text-sm font-medium text-gray-500">
          {((count / total) * 100).toFixed(2)}%
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Customers</p>
          <p className="font-semibold">{count.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="font-semibold">₱{revenue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Avg. Value</p>
          <p className="font-semibold">
            ₱{(revenue / count || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  </div>
);

const SellerAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
    revenueTrend: 0,
    orderTrend: 0,
    customerTrend: 0,
    conversionRate: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);
  const [customerSegments, setCustomerSegments] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch orders data
        const ordersData = await getSellerOrders();

        // Get completed orders only
        const completedOrders = ordersData.filter(
          (order) => order.status === "completed"
        );

        // Calculate date ranges
        const now = new Date();
        const timeRangeMap = {
          week: 7,
          month: 30,
          year: 365,
        };
        const daysToCompare = timeRangeMap[timeRange];
        const compareDate = new Date(
          now.getTime() - daysToCompare * 24 * 60 * 60 * 1000
        );

        const currentPeriodOrders = completedOrders.filter(
          (order) => new Date(order.createdAt) >= compareDate
        );
        const previousPeriodOrders = completedOrders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate >=
              new Date(
                compareDate.getTime() - daysToCompare * 24 * 60 * 60 * 1000
              ) && orderDate < compareDate
          );
        });

        // Calculate trends
        const currentRevenue = currentPeriodOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const previousRevenue = previousPeriodOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const revenueTrend = previousRevenue
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

        const orderTrend = previousPeriodOrders.length
          ? ((currentPeriodOrders.length - previousPeriodOrders.length) /
              previousPeriodOrders.length) *
            100
          : 0;

        const currentCustomers = new Set(
          currentPeriodOrders.map((order) => order.buyer?._id)
        ).size;
        const previousCustomers = new Set(
          previousPeriodOrders.map((order) => order.buyer?._id)
        ).size;
        const customerTrend = previousCustomers
          ? ((currentCustomers - previousCustomers) / previousCustomers) * 100
          : 0;

        // Calculate total stats
        const totalRevenue = completedOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );
        const totalOrders = completedOrders.length;
        const uniqueCustomers = new Set(
          ordersData.map((order) => order.buyer?._id)
        ).size;
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const conversionRate =
          (completedOrders.length / ordersData.length) * 100;

        // Process daily sales data with moving averages
        const dailyData = new Map();
        completedOrders.forEach((order) => {
          const date = new Date(order.createdAt).toLocaleDateString();
          const existing = dailyData.get(date) || {
            revenue: 0,
            orders: 0,
            items: 0,
          };
          dailyData.set(date, {
            revenue: existing.revenue + (order.totalAmount || 0),
            orders: existing.orders + 1,
            items: existing.items + (order.items?.length || 0),
          });
        });

        // Calculate moving averages and convert to array
        const salesTrendData = Array.from(dailyData, ([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders,
          items: data.items,
        }))
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((day, index, array) => {
            const movingAverage =
              array
                .slice(Math.max(0, index - 6), index + 1)
                .reduce((sum, curr) => sum + curr.revenue, 0) /
              Math.min(index + 1, 7);
            return {
              ...day,
              movingAverage,
            };
          });

        // Process hourly stats
        const hourlyMap = new Map();
        completedOrders.forEach((order) => {
          const hour = new Date(order.createdAt).getHours();
          const existing = hourlyMap.get(hour) || { orders: 0, revenue: 0 };
          hourlyMap.set(hour, {
            orders: existing.orders + 1,
            revenue: existing.revenue + (order.totalAmount || 0),
          });
        });

        const hourlyStatsData = Array.from({ length: 24 }, (_, hour) => {
          const data = hourlyMap.get(hour) || { orders: 0, revenue: 0 };
          return {
            hour: `${hour}:00`,
            ...data,
          };
        });

        // Process customer segments
        const customerData = new Map();
        completedOrders.forEach((order) => {
          const customerId = order.buyer?._id;
          if (!customerId) return;

          const existing = customerData.get(customerId) || {
            orders: 0,
            totalSpent: 0,
          };

          customerData.set(customerId, {
            orders: existing.orders + 1,
            totalSpent: existing.totalSpent + (order.totalAmount || 0),
          });
        });

        const segments = {
          vip: { count: 0, revenue: 0 },
          regular: { count: 0, revenue: 0 },
          occasional: { count: 0, revenue: 0 },
        };

        customerData.forEach((data) => {
          if (data.orders >= 5 || data.totalSpent >= 10000) {
            segments.vip.count++;
            segments.vip.revenue += data.totalSpent;
          } else if (data.orders >= 2 || data.totalSpent >= 5000) {
            segments.regular.count++;
            segments.regular.revenue += data.totalSpent;
          } else {
            segments.occasional.count++;
            segments.occasional.revenue += data.totalSpent;
          }
        });

        const customerSegmentsData = Object.entries(segments).map(
          ([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            customers: value.count,
            revenue: value.revenue,
          })
        );

        // Process product performance
        const productData = new Map();
        completedOrders.forEach((order) => {
          order.items?.forEach((item) => {
            if (!item.product) return;
            const existing = productData.get(item.product.name) || {
              sales: 0,
              revenue: 0,
              orders: 0,
            };
            productData.set(item.product.name, {
              sales: existing.sales + (item.quantity || 0),
              revenue:
                existing.revenue + (item.price || 0) * (item.quantity || 0),
              orders: existing.orders + 1,
            });
          });
        });

        const productPerformanceData = Array.from(
          productData,
          ([name, data]) => ({
            name,
            sales: data.sales,
            revenue: data.revenue,
            orders: data.orders,
            averageOrderValue: data.revenue / data.orders,
          })
        ).sort((a, b) => b.revenue - a.revenue);

        // Update state
        setStats({
          totalRevenue,
          totalOrders,
          totalCustomers: uniqueCustomers,
          averageOrderValue,
          revenueTrend,
          orderTrend,
          customerTrend,
          conversionRate,
        });

        setSalesData(salesTrendData);
        setProductPerformance(productPerformanceData);
        setCustomerSegments(customerSegmentsData);
        setHourlyStats(hourlyStatsData);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError(
          err.response?.data?.message || "Failed to load analytics data"
        );
        toast.error("Failed to load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">Please log in to view analytics.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Analytics
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Analytics...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive insights into your store's performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 365 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="Lifetime earnings"
          trend={stats.revenueTrend}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingBag}
          description="Orders processed"
          trend={stats.orderTrend}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={Users}
          description="Unique buyers"
          trend={stats.customerTrend}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats.conversionRate.toFixed(1)}%`}
          icon={Target}
          description="Order completion rate"
        />
      </div>

      {/* Sales Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Revenue Trend</h2>
          <div className="h-[400px]">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value) => [
                      `₱${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    fill="url(#revenue)"
                    name="Daily Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="movingAverage"
                    stroke="#82ca9d"
                    name="7-Day Average"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No revenue data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Hourly Performance</h2>
          <div className="h-[400px]">
            {hourlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#82ca9d"
                    tickFormatter={(value) => `₱${value.toLocaleString()}`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? `₱${value.toLocaleString()}` : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="orders"
                    fill="#8884d8"
                    name="Orders"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    fill="#82ca9d"
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No hourly data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Segments and Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Customer Segments</h2>
            <div className="flex items-center space-x-4">
              {Object.entries(COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-600 capitalize">
                    {key}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {customerSegments.map((segment) => (
              <CustomerSegmentCard
                key={segment.name}
                segment={segment.name}
                count={segment.customers}
                revenue={segment.revenue}
                total={customerSegments.reduce(
                  (sum, s) => sum + s.customers,
                  0
                )}
                description={SEGMENT_DESCRIPTIONS[segment.name.toLowerCase()]}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Top Products</h2>
          <div className="h-[400px]">
            {productPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productPerformance.slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue"
                        ? `₱${value.toLocaleString()}`
                        : name === "averageOrderValue"
                        ? `₱${value.toLocaleString()}`
                        : value,
                      name
                        .replace(/([A-Z])/g, " $1")
                        .charAt(0)
                        .toUpperCase() +
                        name.replace(/([A-Z])/g, " $1").slice(1),
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No product data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Order Value"
          value={`₱${stats.averageOrderValue.toLocaleString()}`}
          icon={ShoppingCart}
          description="Per transaction"
          className="bg-gradient-to-br from-blue-50 to-white"
        />
        <StatCard
          title="Products per Order"
          value={(stats.totalOrders
            ? productPerformance.reduce(
                (sum, product) => sum + product.sales,
                0
              ) / stats.totalOrders
            : 0
          ).toFixed(1)}
          icon={Package}
          description="Average items"
          className="bg-gradient-to-br from-green-50 to-white"
        />
        <StatCard
          title="Peak Hour"
          value={
            hourlyStats.reduce(
              (max, curr) => (curr.orders > (max?.orders || 0) ? curr : max),
              {}
            )?.hour || "N/A"
          }
          icon={Clock}
          description="Most active time"
          className="bg-gradient-to-br from-purple-50 to-white"
        />
        <StatCard
          title="Customer Value"
          value={`₱${(
            stats.totalRevenue / stats.totalCustomers || 0
          ).toLocaleString()}`}
          icon={Activity}
          description="Per customer"
          className="bg-gradient-to-br from-orange-50 to-white"
        />
      </div>
    </div>
  );
};

export default SellerAnalytics;
