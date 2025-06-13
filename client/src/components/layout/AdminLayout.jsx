import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Settings,
  HelpCircle,
  ChevronRight,
  Shield,
  ChevronDown,
  BarChart,
  AlertCircle,
  LogOut,
  Flag,
  Egg,
  Wheat,
  Sun,
  Tractor,
  Home,
} from "lucide-react";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeGroup, setActiveGroup] = useState("dashboard");

  useEffect(() => {
    // Redirect non-admin users
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  const navigation = [
    {
      group: "dashboard",
      label: "Dashboard",
      items: [
        {
          name: "Overview",
          path: "/admin",
          icon: LayoutDashboard,
        },
        {
          name: "Analytics",
          path: "/admin/analytics",
          icon: BarChart,
        },
      ],
    },
    {
      group: "management",
      label: "Management",
      items: [
        {
          name: "Users",
          path: "/admin/users",
          icon: Users,
        },
        {
          name: "Listings",
          path: "/admin/listings",
          icon: Package,
        },
        {
          name: "Reports",
          path: "/admin/reports",
          icon: Flag,
        },
      ],
    },
    {
      group: "system",
      label: "System",
      items: [
        {
          name: "Settings",
          path: "/admin/settings",
          icon: Settings,
        },
        {
          name: "Help",
          path: "/admin/help",
          icon: HelpCircle,
        },
      ],
    },
  ];

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
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

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out ${
          !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        } md:translate-x-0 bg-white border-r border-orange-100 shadow-lg md:shadow-none`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Admin Header */}
          <div className="mb-6 p-2">
            <div className="flex items-center gap-2 px-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Admin Dashboard
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.name || "Administrator"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-4">
            {navigation.map((group) => (
              <div key={group.group}>
                <p className="px-3 text-xs font-semibold text-orange-800/70 uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                          isActive
                            ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 font-medium border-l-2 border-orange-500"
                            : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                        onClick={() => setActiveGroup(group.group)}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive ? "text-orange-500" : "text-gray-400"
                          }`}
                        />
                        {item.name}
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto text-orange-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-orange-100">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>

          {/* Footer with Farm Theme */}
          <div className="mt-4 text-center pt-4">
            <div className="flex items-center justify-center gap-2 text-orange-400">
              <Egg className="h-4 w-4" />
              <Wheat className="h-4 w-4" />
              <Tractor className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              C&P Poultry Admin © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`pt-4 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "md:pl-64" : ""
        } w-full relative`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed bottom-4 right-4 md:hidden z-50 p-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white rounded-full shadow-lg hover:from-orange-500 hover:to-orange-700 transition-all"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? (
          <ChevronDown className="h-6 w-6" />
        ) : (
          <Shield className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default AdminLayout;
