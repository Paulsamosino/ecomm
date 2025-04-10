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
} from "recharts";
import { TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react";

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

const SellerAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
  });
  const [salesData, setSalesData] = useState([]);
  const [productPerformance, setProductPerformance] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch overview stats
        const statsRes = await fetch("/api/seller/analytics/stats", {
          headers,
        });
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch sales data
        const salesRes = await fetch("/api/seller/analytics/sales", {
          headers,
        });
        const salesData = await salesRes.json();
        setSalesData(salesData);

        // Fetch product performance
        const productsRes = await fetch("/api/seller/analytics/products", {
          headers,
        });
        const productsData = await productsRes.json();
        setProductPerformance(productsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-gray-600">Track your store's performance</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          description="Lifetime earnings"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          description="Orders processed"
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          icon={Users}
          description="Unique buyers"
        />
        <StatCard
          title="Average Order Value"
          value={`$${stats.averageOrderValue.toLocaleString()}`}
          icon={TrendingUp}
          description="Per order"
        />
      </div>

      {/* Sales Trend */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Sales Trend</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#82ca9d"
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Product Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Product Performance</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" name="Sales" />
              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
