import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  Users,
  BarChart3,
  ExternalLink,
  Egg,
  Sun,
  Wheat,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock,
} from "lucide-react";
import {
  getSellerStats,
  getSellerOrders,
  getSellerReviews,
  getSellerProducts,
} from "@/api/seller";
import { toast } from "react-hot-toast";

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  percentage,
}) => (
  <div className="bg-white rounded-xl p-6 shadow-md border border-orange-100 transition-all duration-300 hover:shadow-lg hover:border-orange-200 hover:translate-y-[-2px]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-800">{value}</h3>
        <div className="flex items-center mt-1">
          <p className="text-gray-500 text-xs mr-2">{description}</p>
          {trend && (
            <span
              className={`text-xs font-medium flex items-center ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend === "up" ? (
                <ArrowUp className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDown className="w-3 h-3 mr-1" />
              )}
              {percentage}%
            </span>
          )}
        </div>
      </div>
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-xl shadow-md">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const OrderRow = ({ order }) => (
  <div className="border-b border-orange-100 py-4 last:border-0 hover:bg-orange-50 transition-colors rounded-lg px-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-800">
          Order #{order._id.slice(-6)}
        </p>
        <div className="flex items-center">
          <p className="text-sm text-gray-600">
            {order.buyer?.name || "Anonymous"}
          </p>
          <div className="w-1 h-1 rounded-full bg-gray-400 mx-2"></div>
          <p className="text-sm text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1 text-orange-500" />
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-800">
          ₱{order.totalAmount?.toLocaleString()}
        </p>
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
            order.status === "completed"
              ? "bg-green-100 text-green-800"
              : order.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
    </div>
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="border-b border-orange-100 py-4 last:border-0 hover:bg-orange-50 transition-colors rounded-lg px-3">
    <div className="flex items-center justify-between mb-2">
      <p className="font-medium text-gray-800">{review.user.name}</p>
      <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
        <Star className="w-4 h-4 text-yellow-500 fill-current" />
        <span className="ml-1 font-medium text-yellow-700">
          {review.rating}
        </span>
      </div>
    </div>
    <p className="text-gray-600 text-sm bg-white p-3 rounded-lg border border-gray-100">
      {review.comment}
    </p>
    <p className="text-gray-400 text-xs mt-2 flex items-center">
      <Clock className="w-3 h-3 mr-1" />
      {new Date(review.createdAt).toLocaleDateString()}
    </p>
  </div>
);

const SellerDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    pendingOrders: 0,
    averageRating: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [statsData, ordersData, reviewsData, productsData] =
          await Promise.all([
            getSellerStats(),
            getSellerOrders(),
            getSellerReviews(),
            getSellerProducts(),
          ]);

        // Calculate total sales from completed orders
        const completedOrders = ordersData.filter(
          (order) => order.status === "completed"
        );
        const totalSales = completedOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );

        // Calculate monthly revenue (orders from current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyOrders = completedOrders.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear
          );
        });
        const monthlyRevenue = monthlyOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );

        // Get unique customers
        const uniqueCustomers = new Set(
          ordersData.map((order) => order.buyer?._id)
        ).size;

        // Update stats
        setStats({
          totalProducts: productsData.length || 0,
          totalSales: totalSales,
          pendingOrders: ordersData.filter(
            (order) => order.status === "pending"
          ).length,
          averageRating:
            reviewsData.length > 0
              ? reviewsData.reduce((sum, review) => sum + review.rating, 0) /
                reviewsData.length
              : 0,
          totalCustomers: uniqueCustomers,
          monthlyRevenue: monthlyRevenue,
        });

        // Set recent orders and reviews
        setRecentOrders(ordersData.slice(0, 5));
        setRecentReviews(reviewsData.slice(0, 5));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err.response?.data?.message || "Failed to load dashboard data"
        );
        toast.error("Failed to load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-8">
        <div className="text-center bg-white rounded-xl shadow-md p-8 border border-orange-200">
          <Egg className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access the seller dashboard.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all shadow-md inline-block"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center bg-white rounded-xl shadow-md p-8 border border-orange-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all shadow-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center bg-white rounded-xl shadow-md p-8 border border-orange-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Loading Dashboard
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-4 h-4 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "600ms" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with welcome message and action button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mr-3">
              Welcome back, {user?.name}
            </h1>
            <Wheat className="h-6 w-6 text-orange-500" />
          </div>
          <p className="text-gray-600 mt-1 text-sm">
            Here's what's happening with your store today
          </p>
        </div>
        <Link
          to="/seller/post-product"
          className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all shadow-md flex items-center"
        >
          <Package className="w-4 h-4 mr-2" />
          Post New Product
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Active listings"
          trend="up"
          percentage="5.2"
        />
        <StatCard
          title="Total Sales"
          value={`₱${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          description="Lifetime sales"
          trend="up"
          percentage="8.1"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={ShoppingCart}
          description="Orders to fulfill"
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating.toFixed(1)}
          icon={Star}
          description="From customer reviews"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Unique buyers"
          trend="up"
          percentage="12.3"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₱${stats.monthlyRevenue.toLocaleString()}`}
          icon={TrendingUp}
          description="This month"
          trend="up"
          percentage="3.7"
        />
      </div>

      {/* Recent orders and reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-orange-500" />
              Recent Orders
            </h2>
            <Link
              to="/seller/orders"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
            >
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-orange-100">
              {recentOrders.map((order) => (
                <OrderRow key={order._id} order={order} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-orange-50 rounded-lg">
              <p className="text-gray-600">No orders yet</p>
            </div>
          )}
        </div>

        {/* Recent reviews section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-orange-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Star className="w-5 h-5 mr-2 text-orange-500" />
              Recent Reviews
            </h2>
            <Link
              to="/seller/reviews"
              className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
            >
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {recentReviews.length > 0 ? (
            <div className="divide-y divide-orange-100">
              {recentReviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-orange-50 rounded-lg">
              <p className="text-gray-600">No reviews yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick tips section */}
      <div className="mt-8 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 shadow-sm border border-orange-200">
        <div className="flex items-start gap-4">
          <div className="bg-white rounded-full p-3 shadow-md border border-orange-200">
            <Sun className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Grow Your Farm Business
            </h3>
            <ul className="text-orange-700 space-y-2 ml-5 list-disc">
              <li>Add clear photos of your products to increase sales</li>
              <li>Respond quickly to customer inquiries</li>
              <li>Update your inventory regularly to show availability</li>
              <li>Offer special discounts to returning customers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
