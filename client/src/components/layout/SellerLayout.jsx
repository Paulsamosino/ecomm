import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  Settings,
  ChevronRight,
  Users,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import SellerNavbar from "./SellerNavbar";

const SellerLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeGroup, setActiveGroup] = useState("dashboard");

  const navigation = [
    {
      group: "dashboard",
      label: "Dashboard",
      items: [
        {
          name: "Overview",
          path: "/seller",
          icon: LayoutDashboard,
        },
        {
          name: "Analytics",
          path: "/seller/analytics",
          icon: TrendingUp,
        },
      ],
    },
    {
      group: "inventory",
      label: "Inventory",
      items: [
        {
          name: "Products",
          path: "/seller/products",
          icon: Package,
        },
        {
          name: "Orders",
          path: "/seller/orders",
          icon: ShoppingCart,
        },
      ],
    },
    {
      group: "customer",
      label: "Customer",
      items: [
        {
          name: "Messages",
          path: "/seller/messages",
          icon: MessageSquare,
        },
        {
          name: "Reviews",
          path: "/seller/reviews",
          icon: Star,
        },
        {
          name: "Customers",
          path: "/seller/customers",
          icon: Users,
        },
      ],
    },
    {
      group: "settings",
      label: "Settings",
      items: [
        {
          name: "Store Settings",
          path: "/seller/settings",
          icon: Settings,
        },
        {
          name: "Help Center",
          path: "/seller/help",
          icon: HelpCircle,
        },
      ],
    },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <SellerNavbar />

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out z-20 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full py-4">
          <div className="flex-1 space-y-1 px-3">
            {navigation.map((group) => (
              <div key={group.group} className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {group.label}
                </h3>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = isActivePath(item.path);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setActiveGroup(group.group)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Store Info */}
          <div className="px-3 py-4 mt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.sellerProfile?.businessName || "Your Store"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.sellerProfile?.storeType || "General Store"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`pt-16 ${
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
          <ChevronRight className="h-6 w-6" />
        ) : (
          <Store className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default SellerLayout;
