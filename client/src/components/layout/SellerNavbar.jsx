import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  Menu,
  X,
  LogOut,
  Settings,
  Store,
  HelpCircle,
  Plus,
  ExternalLink,
  DollarSign,
  AlertCircle,
} from "lucide-react";

const SellerNavbar = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications] = useState([
    {
      id: 1,
      title: "New Order",
      message: "You have received a new order #123",
      time: "5 minutes ago",
      isRead: false,
      type: "order",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Product 'Layer Chicken' is running low on stock",
      time: "10 minutes ago",
      isRead: false,
      type: "alert",
    },
  ]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return (
          <DollarSign className="h-8 w-8 text-green-500 p-1.5 bg-green-50 rounded-full" />
        );
      case "alert":
        return (
          <AlertCircle className="h-8 w-8 text-yellow-500 p-1.5 bg-yellow-50 rounded-full" />
        );
      default:
        return (
          <Bell className="h-8 w-8 text-gray-400 p-1.5 bg-gray-50 rounded-full" />
        );
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - Logo and Store Name */}
          <div className="flex items-center gap-3">
            <Link to="/seller" className="flex items-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Seller Hub</h1>
                <p className="text-xs text-gray-500">Manage your business</p>
              </div>
            </Link>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-4">
            {/* Quick Actions */}
            <Link
              to="/seller/products/new"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {notifications.some((n) => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>

              {/* Notifications dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button className="text-xs text-primary hover:underline">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-start gap-3"
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <Link
                      to="/seller/notifications"
                      className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                    >
                      View all notifications
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Help */}
            <Link
              to="/seller/help"
              className="p-2 rounded-full hover:bg-gray-100"
              title="Help Center"
            >
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Link>

            {/* Settings */}
            <Link
              to="/seller/settings"
              className="p-2 rounded-full hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </Link>

            {/* User Menu */}
            <div className="relative ml-2">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-50 cursor-pointer hover:bg-gray-100">
                <div>
                  <p className="text-sm font-medium">
                    {user?.sellerProfile?.businessName || "Your Store"}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-600" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col space-y-2">
              <Link
                to="/seller/products/new"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Add Product</span>
              </Link>
              <Link
                to="/seller/help"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <HelpCircle className="h-5 w-5" />
                <span>Help Center</span>
              </Link>
              <Link
                to="/seller/settings"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SellerNavbar;
