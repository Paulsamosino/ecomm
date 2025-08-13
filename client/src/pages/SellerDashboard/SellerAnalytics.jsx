import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
  Download,
} from "lucide-react";
import { getSellerAnalytics, getSellerStats } from "@/api/seller";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

const SellerAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    dailyRevenue: [],
    categoryBreakdown: [],
    recentReviews: [],
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    recentReviews: [],
  });
  const [timeframe, setTimeframe] = useState("30");

  useEffect(() => {
    fetchAnalyticsData();
    fetchStats();
  }, [timeframe]);

  const fetchAnalyticsData = async () => {
    try {
      const data = await getSellerAnalytics();
      console.log("Analytics data received:", data);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data");
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getSellerStats();
      console.log("Stats data received:", data);
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = () => {
    return analyticsData.dailyRevenue.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
  };

  const calculateTotalOrders = () => {
    return analyticsData.dailyRevenue.reduce(
      (sum, day) => sum + day.orders,
      0
    );
  };

  const calculateAverageOrderValue = () => {
    const totalRevenue = calculateTotalRevenue();
    const totalOrders = calculateTotalOrders();
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  };

  const getRevenueGrowth = () => {
    if (analyticsData.dailyRevenue.length < 2) return 0;
    
    const recent = analyticsData.dailyRevenue.slice(-7);
    const previous = analyticsData.dailyRevenue.slice(-14, -7);
    
    const recentRevenue = recent.reduce((sum, day) => sum + day.revenue, 0);
    const previousRevenue = previous.reduce((sum, day) => sum + day.revenue, 0);
    
    if (previousRevenue === 0) return 0;
    return ((recentRevenue - previousRevenue) / previousRevenue) * 100;
  };

  const exportData = () => {
    const csvData = [
      ["Date", "Revenue", "Orders"],
      ...analyticsData.dailyRevenue.map((day) => [
        day._id,
        day.revenue.toFixed(2),
        day.orders,
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Analytics data exported successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const revenueGrowth = getRevenueGrowth();
  const totalRevenue = calculateTotalRevenue();
  const totalOrders = calculateTotalOrders();
  const averageOrderValue = calculateAverageOrderValue();

  // Debug: Log current reviews data
  console.log("Current analytics reviews:", analyticsData.recentReviews);
  console.log("Current stats reviews:", stats.recentReviews);
  console.log("Total reviews count:", stats.totalReviews);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <h4 className="font-semibold text-yellow-800">Debug Info:</h4>
        <p className="text-sm text-yellow-700">
          Current User: {user?.name || 'Not logged in'} ({user?.email || 'No email'})
        </p>
        <p className="text-sm text-yellow-700">
          User ID: {user?._id || 'No ID'}
        </p>
        <p className="text-sm text-yellow-700">
          Is Seller: {user?.isSeller ? 'Yes' : 'No'}
        </p>
      </div>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-600">Track your store performance and insights</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">
                ₱{totalRevenue.toLocaleString()}
              </h3>
              <div className="flex items-center mt-1">
                <span
                  className={`text-xs font-medium flex items-center ${
                    revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {revenueGrowth >= 0 ? (
                    <ArrowUp className="w-3 h-3 mr-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 mr-1" />
                  )}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </span>
                <span className="text-gray-500 text-xs ml-2">vs last week</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">
                {totalOrders}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Last {timeframe} days</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Order Value</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">
                ₱{averageOrderValue.toFixed(0)}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Per order</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">
                {stats.totalProducts}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Active listings</p>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-xl">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Reviews</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-800">
                {stats.totalReviews || 0}
              </h3>
              <p className="text-gray-500 text-xs mt-1">Customer feedback</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Daily Revenue</h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.dailyRevenue.slice(-7).map((day, index) => (
              <div key={day._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">
                    {new Date(day._id).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">₱{day.revenue.toLocaleString()}</span>
                  <div className="text-xs text-gray-500">{day.orders} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Category Performance</h3>
            <Eye className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analyticsData.categoryBreakdown.slice(0, 5).map((category, index) => (
              <div key={category._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` 
                    }}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {category._id || "Uncategorized"}
                  </span>
                </div>
                <span className="font-medium">
                  ₱{category.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Reviews</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {(analyticsData.recentReviews || stats.recentReviews || []).slice(0, 5).map((review, index) => (
              <div key={review._id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-xs ${
                          i < review.rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">
                    {review.user?.name || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {review.comment}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {review.productName} • {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {(!analyticsData.recentReviews?.length && !stats.recentReviews?.length) && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No reviews yet</p>
                <p className="text-xs">Reviews will appear here when customers review your products</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100">
        <h3 className="text-lg font-semibold mb-6">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold mb-1">Revenue Growth</h4>
            <p className="text-2xl font-bold text-green-600 mb-1">
              {revenueGrowth >= 0 ? "+" : ""}{revenueGrowth.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">Compared to last week</p>
          </div>

          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold mb-1">Customer Rating</h4>
            <p className="text-2xl font-bold text-blue-600 mb-1">
              {stats.averageRating || "0.0"}
            </p>
            <p className="text-sm text-gray-500">Average rating</p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold mb-1">Active Days</h4>
            <p className="text-2xl font-bold text-purple-600 mb-1">
              {analyticsData.dailyRevenue.filter(day => day.orders > 0).length}
            </p>
            <p className="text-sm text-gray-500">Days with sales</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
