import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Store,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Star,
  ChevronRight,
  Users,
  TrendingUp,
  ChevronDown,
  MessageSquare,
  Menu,
  X,
  LayoutGrid,
  BarChart2,
  Bird,
  Plus,
  Egg,
  Wheat,
  Sun,
  Tractor,
} from "lucide-react";
import SellerNavbar from "./SellerNavbar";

const SellerLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        {
          name: "Breeding Management",
          path: "/seller/breeding-management",
          icon: Egg,
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
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white overflow-x-hidden">
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

      <SellerNavbar />
      <div className="flex pt-16 relative">
        {/* Sidebar */}
        <aside
          className={`
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }
            ${
              isMobile
                ? "fixed inset-y-0 left-0 z-30 w-64"
                : "sticky top-16 w-64 md:w-20 lg:w-64"
            }
            bg-white border-r border-orange-100 transition-all duration-300 ease-in-out
            h-[calc(100vh-4rem)] overflow-y-auto
          `}
        >
          {/* Mobile Overlay */}
          {isMobile && isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((group) => (
                <div key={group.group} className="mb-6">
                  <h3
                    className={`px-3 text-xs font-semibold text-orange-800/70 uppercase tracking-wider ${
                      !isSidebarOpen && !isMobile ? "sr-only" : ""
                    }`}
                  >
                    {group.label}
                  </h3>
                  <div className="mt-3 space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`${
                          location.pathname === item.path
                            ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-l-2 border-orange-500"
                            : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        } group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors`}
                        onClick={() => isMobile && setSidebarOpen(false)}
                      >
                        <item.icon
                          className={`${
                            location.pathname === item.path
                              ? "text-orange-500"
                              : "text-gray-400 group-hover:text-orange-400"
                          } flex-shrink-0 h-6 w-6 ${
                            isSidebarOpen || isMobile ? "mr-3" : ""
                          }`}
                        />
                        {(isSidebarOpen || isMobile) && item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Farm Theme */}
            <div className="px-3 py-4 border-t border-orange-100 mt-auto">
              <div className="flex items-center justify-center gap-2 text-orange-400">
                <Egg className="h-4 w-4" />
                <Wheat className="h-4 w-4" />
                <Tractor className="h-4 w-4" />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                C&P Poultry Seller © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 py-4 px-3 sm:px-4 md:px-6 lg:px-8 ${
            isMobile ? "w-full pb-24" : ""
          } relative z-10`}
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <>
            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 shadow-lg md:hidden z-40">
              {/* Floating Action Button */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-50">
                <Link
                  to="/seller/products/new"
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  title="Add Product"
                >
                  <Plus className="h-6 w-6" />
                </Link>
              </div>
              <div className="grid grid-cols-5 gap-1 py-3 px-1">
                <Link
                  to="/seller/dashboard"
                  className={`flex flex-col items-center justify-center min-w-0 p-1 rounded-lg transition-colors ${
                    location.pathname === "/seller/dashboard"
                      ? "text-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid
                    className={`h-6 w-6 ${
                      location.pathname === "/seller/dashboard"
                        ? "text-orange-500"
                        : ""
                    }`}
                  />
                  <span className="text-[10px] font-medium mt-1">Home</span>
                </Link>
                <Link
                  to="/seller/analytics"
                  className={`flex flex-col items-center justify-center min-w-0 p-1 rounded-lg transition-colors ${
                    location.pathname.startsWith("/seller/analytics")
                      ? "text-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart2
                    className={`h-6 w-6 ${
                      location.pathname.startsWith("/seller/analytics")
                        ? "text-orange-500"
                        : ""
                    }`}
                  />
                  <span className="text-[10px] font-medium mt-1">Stats</span>
                </Link>
                <div className="relative flex items-center justify-center">
                  <div className="w-14 h-14 flex items-center justify-center">
                    <div className="w-10 h-10"></div>
                  </div>
                </div>
                <Link
                  to="/seller/orders"
                  className={`flex flex-col items-center justify-center min-w-0 p-1 rounded-lg transition-colors ${
                    location.pathname.startsWith("/seller/orders")
                      ? "text-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <ShoppingCart
                    className={`h-6 w-6 ${
                      location.pathname.startsWith("/seller/orders")
                        ? "text-orange-500"
                        : ""
                    }`}
                  />
                  <span className="text-[10px] font-medium mt-1">Orders</span>
                </Link>
                <Link
                  to="/seller/breeding-management"
                  className={`flex flex-col items-center justify-center min-w-0 p-1 rounded-lg transition-colors ${
                    location.pathname.startsWith("/seller/breeding")
                      ? "text-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Egg
                    className={`h-6 w-6 ${
                      location.pathname.startsWith("/seller/breeding")
                        ? "text-orange-500"
                        : ""
                    }`}
                  />
                  <span className="text-[10px] font-medium mt-1">Breeding</span>
                </Link>
              </div>
            </nav>

            {/* Bottom padding for content */}
            <div className="h-20"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerLayout;
