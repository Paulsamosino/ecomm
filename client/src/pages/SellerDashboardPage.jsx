import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart2,
  Egg,
  Settings,
  PlusCircle,
  Store,
  HelpCircle,
  MessageCircle,
  Wheat,
  Sun,
  Leaf,
  Home,
  Tractor,
} from "lucide-react";

const navItems = [
  {
    path: "/seller-dashboard/profile",
    label: "Profile",
    icon: <User className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/post-product",
    label: "Post Product",
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/products",
    label: "Products",
    icon: <Package className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/orders",
    label: "Orders",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/customers",
    label: "Customers",
    icon: <Users className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/payments",
    label: "Payments",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    path: "/seller-dashboard/analytics",
    label: "Analytics",
    icon: <BarChart2 className="h-4 w-4" />,
  },
];

const SellerDashboardPage = () => {
  const location = useLocation();
  const activeTab = location.pathname;

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
        {/* Header with Farm Theme Icons */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
            <Tractor className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700">
              Farm Seller Center
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your poultry business
            </p>
          </div>
          <div className="ml-auto">
            <Link
              to="/seller-dashboard/post-product"
              className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-md rounded-lg px-4 py-2 inline-flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Product</span>
            </Link>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3">
            {navItems.map((item) => (
              <Link to={item.path} key={item.path} className="w-full">
                <div
                  className={`
                    flex flex-col items-center justify-center p-3 rounded-2xl text-sm font-medium transition-all duration-300 h-full
                    ${
                      activeTab === item.path
                        ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md transform hover:-translate-y-1"
                        : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-orange-100 shadow-sm hover:shadow transform hover:-translate-y-1"
                    }
                  `}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      activeTab === item.path ? "bg-white/20" : "bg-orange-100"
                    }`}
                  >
                    {React.cloneElement(item.icon, {
                      className: `h-5 w-5 ${
                        activeTab === item.path
                          ? "text-white"
                          : "text-orange-500"
                      }`,
                    })}
                  </div>
                  <span className="text-center">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Content Area with Farm-themed Border */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/50 py-3 px-4 flex items-center">
            <div className="flex items-center">
              {activeTab.includes("/profile") && (
                <User className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/post-product") && (
                <PlusCircle className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/products") && (
                <Package className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/orders") && (
                <ShoppingCart className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/customers") && (
                <Users className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/payments") && (
                <CreditCard className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/analytics") && (
                <BarChart2 className="h-4 w-4 mr-2 text-orange-500" />
              )}
              {activeTab.includes("/breeding") && (
                <Egg className="h-4 w-4 mr-2 text-orange-500" />
              )}
              <h2 className="text-sm font-medium text-orange-800">
                {navItems.find((item) => activeTab === item.path)?.label ||
                  "Dashboard"}
              </h2>
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
              >
                <Home className="h-4 w-4 mr-1" />
                <span className="text-xs">Home</span>
              </Button>
            </div>
          </div>
          <Outlet />
        </div>

        {/* Footer with Farm Theme */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <Egg className="h-4 w-4" />
            <Wheat className="h-4 w-4" />
            <Sun className="h-4 w-4" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            C&P Poultry Seller Dashboard © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
