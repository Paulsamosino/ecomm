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
} from "lucide-react";
import {
  getSellerStats,
  getSellerOrders,
  getSellerReviews,
  getSellerProducts,
} from "@/api/seller";
import { toast } from "react-hot-toast";

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white rounded-lg p-6 shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>
      <div className="bg-primary/10 p-3 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
    </div>
  </div>
);

const OrderRow = ({ order }) => (
  <div className="border-b border-gray-200 py-4 last:border-0">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Order #{order._id.slice(-6)}</p>
        <p className="text-sm text-gray-600">
          {order.buyer?.name || "Anonymous"} •{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium">₱{order.totalAmount?.toLocaleString()}</p>
        <span
          className={`inline-block px-2 py-1 text-xs rounded-full ${
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
  <div className="border-b border-gray-200 py-4 last:border-0">
    <div className="flex items-center justify-between mb-2">
      <p className="font-medium">{review.user.name}</p>
      <div className="flex items-center">
        <Star className="w-4 h-4 text-yellow-400 fill-current" />
        <span className="ml-1">{review.rating}</span>
      </div>
    </div>
    <p className="text-gray-600 text-sm">{review.comment}</p>
    <p className="text-gray-400 text-xs mt-1">
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access the seller dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Dashboard
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Dashboard...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link
          to="/seller/post-product"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Post New Product
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Active listings"
        />
        <StatCard
          title="Total Sales"
          value={`₱${stats.totalSales.toLocaleString()}`}
          icon={DollarSign}
          description="Lifetime sales"
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
          description={`From ${recentReviews.length} reviews`}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Unique buyers"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₱${stats.monthlyRevenue.toLocaleString()}`}
          icon={BarChart3}
          description="This month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link
              to="/seller/orders"
              className="text-primary hover:text-primary/80 flex items-center text-sm"
            >
              View All <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <OrderRow key={order._id} order={order} />
              ))
            ) : (
              <p className="text-gray-500 py-4">No recent orders</p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Reviews</h2>
            <Link
              to="/seller/reviews"
              className="text-primary hover:text-primary/80 flex items-center text-sm"
            >
              View All <ExternalLink className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentReviews.length > 0 ? (
              recentReviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))
            ) : (
              <p className="text-gray-500 py-4">No reviews yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
