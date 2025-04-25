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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white border-r border-gray-200`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          {/* Admin Header */}
          <div className="mb-6 p-2">
            <div className="flex items-center gap-2 px-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
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
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setActiveGroup(group.group)}
                      >
                        <Icon className="h-5 w-5" />
                        {item.name}
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-600 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`pt-4 ${
          isSidebarOpen ? "md:pl-64" : ""
        } transition-all duration-200`}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </div>

      {/* Mobile Sidebar Toggle */}
      <button
        className="fixed bottom-4 right-4 md:hidden z-30 p-3 bg-primary text-white rounded-full shadow-lg"
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
