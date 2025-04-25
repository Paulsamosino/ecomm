import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import {
  Users,
  Package,
  AlertCircle,
  Clock,
  CheckCircle2,
  Bell,
  Settings,
  ShieldAlert,
  Activity,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGetAdminStats } from "@/api/admin";
import toast from "react-hot-toast";

const ActionCard = ({
  title,
  count,
  status,
  icon: Icon,
  variant = "default",
}) => (
  <div
    className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all ${
      variant === "warning"
        ? "border-l-4 border-l-yellow-500"
        : variant === "critical"
        ? "border-l-4 border-l-red-500"
        : variant === "success"
        ? "border-l-4 border-l-green-500"
        : ""
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon
            className={`w-5 h-5 ${
              variant === "warning"
                ? "text-yellow-500"
                : variant === "critical"
                ? "text-red-500"
                : variant === "success"
                ? "text-green-500"
                : "text-primary"
            }`}
          />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {count !== undefined && (
          <p className="text-2xl font-semibold mt-2">{count}</p>
        )}
        {status && <p className="text-sm text-gray-500 mt-1">{status}</p>}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ icon: Icon, title, time, status }) => (
  <div className="flex items-start gap-4 py-3">
    <div className="mt-1">
      <Icon className="w-5 h-5 text-gray-400" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500">{time}</p>
    </div>
    {status && (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          status === "Pending"
            ? "bg-yellow-100 text-yellow-800"
            : status === "Completed"
            ? "bg-green-100 text-green-800"
            : status === "Failed"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    )}
  </div>
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    pendingApprovals: 5,
    activeUsers: 24,
    systemHealth: "Healthy",
    recentReports: 3,
    pendingOrders: 8,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await apiGetAdminStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast.error("Failed to load dashboard information");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's what needs your attention today
        </p>
      </div>

      {/* Priority Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <ActionCard
          title="Pending Approvals"
          count={stats.pendingApprovals}
          status="Requires immediate attention"
          icon={AlertCircle}
          variant="warning"
        />
        <ActionCard
          title="System Status"
          status={stats.systemHealth}
          icon={Activity}
          variant="success"
        />
        <ActionCard
          title="Recent Reports"
          count={stats.recentReports}
          status="New user reports"
          icon={Flag}
          variant="critical"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-1">
              <ActivityItem
                icon={Users}
                title="New user registration: John Smith"
                time="5 minutes ago"
                status="Pending"
              />
              <ActivityItem
                icon={Package}
                title="Product listing updated: Organic Eggs"
                time="15 minutes ago"
                status="Completed"
              />
              <ActivityItem
                icon={ShieldAlert}
                title="Suspicious login attempt detected"
                time="1 hour ago"
                status="Failed"
              />
              <ActivityItem
                icon={Bell}
                title="System maintenance scheduled"
                time="2 hours ago"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Button>
              </Link>
              <Link to="/admin/listings">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Review Listings
                </Button>
              </Link>
              <Link to="/admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* System Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">System Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Server Load</span>
                  <span>45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Storage Usage</span>
                  <span>72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "72%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>28%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "28%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area for Sub-routes */}
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
