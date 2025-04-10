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
          {order.buyer.name} • {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium">${order.totalAmount.toLocaleString()}</p>
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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch statistics
        const statsRes = await fetch("/api/seller/stats", { headers });
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch recent orders
        const ordersRes = await fetch("/api/seller/orders/recent", { headers });
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData);

        // Fetch recent reviews
        const reviewsRes = await fetch("/api/seller/reviews/recent", {
          headers,
        });
        const reviewsData = await reviewsRes.json();
        setRecentReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching seller data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.sellerProfile?.businessName || user?.name}
          </p>
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
          value={`$${stats.totalSales.toLocaleString()}`}
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
          description={`From ${
            user?.sellerProfile?.reviews?.length || 0
          } reviews`}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Unique buyers"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
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
