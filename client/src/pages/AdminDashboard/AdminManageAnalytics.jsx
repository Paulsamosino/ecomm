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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ShoppingBag,
  Star,
  Calendar,
} from "lucide-react";
import { apiGetAdminStats, apiGetAnalytics } from "@/api/admin";
import { toast } from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const StatCard = ({ title, value, icon: Icon, description, trend }) => (
  <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        <div className="flex items-center mt-1">
          <p className="text-gray-500 text-sm">{description}</p>
          {trend && (
            <span
              className={`ml-2 text-sm font-medium ${
                parseFloat(trend) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {parseFloat(trend).toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
);

const AdminManageAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    userGrowth: 0,
    revenueGrowth: 0,
    productGrowth: 0,
  });
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    users: [],
    products: [],
    categories: [],
    orderStatus: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, analytics] = await Promise.all([
          apiGetAdminStats(),
          apiGetAnalytics(period),
        ]);

        setStats({
          totalRevenue: statsData.totalRevenue || 0,
          totalUsers: statsData.totalUsers || 0,
          totalProducts: statsData.totalProducts || 0,
          totalOrders: statsData.totalOrders || 0,
          averageOrderValue: statsData.averageOrderValue || 0,
          userGrowth: statsData.userGrowth || 0,
          revenueGrowth: statsData.revenueGrowth || 0,
          productGrowth: statsData.productGrowth || 0,
        });

        setAnalyticsData({
          revenue: analytics.revenue?.dailyStats || [],
          users: analytics.users?.dailyStats || [],
          products: analytics.products?.dailyStats || [],
          categories: analytics.products?.categories || [],
          orderStatus: analytics.revenue?.orderStatus || [],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
        toast.error("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Overview</h1>
          <p className="text-gray-600">
            Monitor platform performance and growth
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₱${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="Platform earnings"
          trend={stats.revenueGrowth}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          description="Registered users"
          trend={stats.userGrowth}
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          description="Listed products"
          trend={stats.productGrowth}
        />
        <StatCard
          title="Average Order"
          value={`₱${stats.averageOrderValue.toLocaleString()}`}
          icon={ShoppingBag}
          description="Per transaction"
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Revenue Trends</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData.revenue}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `₱${value.toLocaleString()}`} />
              <Tooltip
                formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#revenue)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Growth */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">User Growth</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.users}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00C49F"
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Categories */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Product Categories</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.categories}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {analyticsData.categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">
          Order Status Distribution
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.orderStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export { AdminManageAnalytics as default };
