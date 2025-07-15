import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  AlertTriangle,
  BarChart3,
  Flag,
  Settings,
  MonitorPlay,
} from "lucide-react";
import { apiGetAdminStats } from "@/api/admin";
import toast from "react-hot-toast";

const StatsCard = ({ title, value, icon: Icon, status, link }) => (
  <Link 
    to={link}
    className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {status && (
          <p className="text-sm text-gray-500 mt-1">{status}</p>
        )}
      </div>
      <Icon className="h-8 w-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
    </div>
  </Link>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    pendingReports: 0,
    pendingListings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGetAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your poultry marketplace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          link="/admin/users"
        />
        <StatsCard
          title="Product Listings"
          value={stats.totalListings || 0}
          icon={Package}
          link="/admin/listings"
        />
        <StatsCard
          title="Pending Reports"
          value={stats.pendingReports || 0}
          icon={Flag}
          status={stats.pendingReports > 0 ? "Requires attention" : "All clear"}
          link="/admin/reports"
        />
        <StatsCard
          title="Advertisements"
          value="Manage"
          icon={MonitorPlay}
          link="/admin/ads"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
          <Link 
            to="/admin/users"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Users →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Product Listings</h3>
          </div>
          <p className="text-gray-600 mb-4">Review and manage product listings</p>
          <Link 
            to="/admin/listings"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
          >
            Manage Listings →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Flag className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Reports</h3>
          </div>
          <p className="text-gray-600 mb-4">Handle user and content reports</p>
          <Link 
            to="/admin/reports"
            className="inline-flex items-center text-red-600 hover:text-red-700 font-medium"
          >
            View Reports →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <MonitorPlay className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Advertisement Management</h3>
          </div>
          <p className="text-gray-600 mb-4">Create and manage ads shown to buyers</p>
          <Link 
            to="/admin/ads"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Ads →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Analytics</h3>
          </div>
          <p className="text-gray-600 mb-4">View platform metrics and insights</p>
          <Link 
            to="/admin/analytics"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            View Analytics →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold">Settings</h3>
          </div>
          <p className="text-gray-600 mb-4">Configure platform settings</p>
          <Link 
            to="/admin/settings"
            className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
          >
            Open Settings →
          </Link>
        </div>

        {stats.pendingReports > 0 && (
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">Urgent Attention</h3>
            </div>
            <p className="text-red-700 mb-4">
              You have {stats.pendingReports} pending reports that need review
            </p>
            <Link 
              to="/admin/reports"
              className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
            >
              Review Now →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
