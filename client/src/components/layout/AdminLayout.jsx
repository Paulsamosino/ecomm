import React, { useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  HelpCircle,
  BarChart,
  LogOut,
  Flag,
  MonitorPlay,
  FileText,
} from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const navigation = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Listings", path: "/admin/listings", icon: Package },
    { name: "Reports", path: "/admin/reports", icon: Flag },
    { name: "Logs", path: "/admin/logs", icon: FileText },
    { name: "Ads", path: "/admin/ads", icon: MonitorPlay },
    { name: "Analytics", path: "/admin/analytics", icon: BarChart },
    { name: "Blog", path: "/admin/blog", icon: FileText },
    { name: "Messages", path: "/admin/messages", icon: HelpCircle },
  ];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 z-40 w-64 h-screen bg-gradient-to-b from-orange-600 to-orange-700 shadow-xl">
        <div className="h-full px-4 py-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-8 p-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <LayoutDashboard className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Admin Panel</p>
                <p className="text-sm text-orange-100">{user?.name || "Administrator"}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-white text-orange-600 shadow-lg transform scale-105"
                      : "text-orange-100 hover:bg-white/10 hover:text-white hover:pl-6"
                  }`}
                >
                  <Icon className={`mr-4 h-5 w-5 transition-transform duration-200 ${
                    isActive ? "text-orange-600" : "text-orange-200 group-hover:text-white group-hover:scale-110"
                  }`} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-6 left-4 right-4">
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-orange-100 hover:bg-red-500/20 hover:text-white rounded-xl transition-all duration-200 group border border-orange-400/30"
            >
              <LogOut className="mr-4 h-5 w-5 text-orange-200 group-hover:text-white transition-colors duration-200" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;

