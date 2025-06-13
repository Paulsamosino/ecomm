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
  Egg,
  Wheat,
  Sun,
  Tractor,
  Home,
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
    className={`bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all hover:border-orange-200 ${
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
                : "text-orange-500"
            }`}
          />
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {count !== undefined && (
          <p className="text-2xl font-bold mt-2 text-gray-800">{count}</p>
        )}
        {status && <p className="text-sm text-gray-500 mt-1">{status}</p>}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ icon: Icon, title, time, status }) => (
  <div className="flex items-start gap-4 py-3 border-b border-orange-100 last:border-0 hover:bg-orange-50 transition-colors rounded-lg px-3">
    <div className="mt-1">
      <Icon className="w-5 h-5 text-orange-400" />
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 flex items-center">
        <Clock className="w-3 h-3 mr-1 text-orange-300" />
        {time}
      </p>
    </div>
    {status && (
      <span
        className={`px-2 py-1 text-xs rounded-full font-medium ${
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
    <div className="p-6 bg-gradient-to-b from-orange-50 to-white min-h-screen">
      {/* Farm-themed background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjZmM5ODMwIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PHBhdGggZD0iTTIwIDBoMjB2MjBIMjB6Ii8+PHBhdGggZD0iTTAgMjBoMjB2MjBIMHoiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6Ii8+PC9nPjwvc3ZnPg==')",
          }}
        />
        <div className="absolute top-20 -right-20 w-64 h-64 bg-orange-400/10 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      <div className="container mx-auto relative">
        {/* Header with Farm Theme */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Monitor and manage your poultry e-commerce platform
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {" "}
            <Link
              to="/admin/settings"
              className="inline-flex items-center px-4 py-2 text-orange-600 hover:bg-orange-100 hover:text-orange-700 rounded-lg"
            >
              <Settings className="h-4 w-4 mr-1" />
              <span>Settings</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-md rounded-lg"
            >
              <Home className="h-4 w-4 mr-1" />
              <span>View Site</span>
            </Link>
          </div>
        </div>

        {/* Admin navigation buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200"
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Link>
          <Link
            to="/admin/products"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200"
          >
            <Package className="h-4 w-4 mr-2" />
            Products
          </Link>
          <Link
            to="/admin/reports"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200"
          >
            <Flag className="h-4 w-4 mr-2" />
            Reports
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200"
          >
            <Activity className="h-4 w-4 mr-2" />
            Analytics
          </Link>
        </div>

        {/* Priority Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-orange-500 mr-2" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                    Recent Activity
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-orange-200 text-orange-600 hover:bg-orange-50"
                >
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
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 sm:p-6">
              <div className="flex items-center mb-3 sm:mb-4">
                <Wheat className="h-5 w-5 text-orange-500 mr-2" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Quick Actions
                </h2>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-orange-100 text-orange-700 hover:bg-orange-200"
                  asChild
                >
                  <Link to="/admin/products/approve">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Product Listings ({stats.pendingApprovals})
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start bg-orange-100 text-orange-700 hover:bg-orange-200"
                  asChild
                >
                  <Link to="/admin/orders">
                    <Clock className="h-4 w-4 mr-2" />
                    Process Pending Orders ({stats.pendingOrders})
                  </Link>
                </Button>
                <Button
                  className="w-full justify-start bg-orange-100 text-orange-700 hover:bg-orange-200"
                  asChild
                >
                  <Link to="/admin/settings/maintenance">
                    <Settings className="h-4 w-4 mr-2" />
                    System Maintenance
                  </Link>
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 shadow-sm border border-orange-200">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-2 shadow-sm border border-orange-200">
                  <Sun className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-orange-800 mb-2">
                    System Health
                  </h3>
                  <p className="text-xs text-orange-700 mb-2">
                    All systems operational
                  </p>
                  <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[95%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Farm Theme */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <Egg className="h-4 w-4" />
            <Wheat className="h-4 w-4" />
            <Tractor className="h-4 w-4" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            C&P Poultry - Admin Dashboard © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
