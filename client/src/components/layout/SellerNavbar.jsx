import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Menu,
  X,
  Package,
  ShoppingBag,
  Users,
  MessageSquare,
  LogOut,
  ChevronDown,
  User,
  Bell,
  PlusCircle,
  Wheat, // Farm-themed icon
  Sun, // Farm-themed icon
  Egg, // Farm-themed icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

const SellerNavbar = () => {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gradient-to-r from-orange-400 to-orange-600 shadow-md"
          : "bg-gradient-to-r from-orange-400 to-orange-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/seller/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-white mr-2">C&P</span>
              <span className="hidden md:inline-block text-sm font-medium text-white">
                Seller Center
              </span>
              <Egg className="h-5 w-5 ml-2 text-white" />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Add New Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex items-center gap-1 bg-white text-orange-600 border-white hover:bg-white/90"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/seller/products/new" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>New Product</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            <button className="p-2 text-white hover:text-white/80 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-yellow-300"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <ProfileAvatar user={user} size="sm" />
                <span className="hidden md:inline-block text-sm font-medium text-white">
                  {user?.name || "Account"}
                </span>
                <ChevronDown className="h-4 w-4 text-white" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || "Seller"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || ""}
                      </p>
                    </div>
                    <Link
                      to="/seller-dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4 mr-2 text-orange-500" />
                      My Account
                    </Link>
                    <Link
                      to="/seller-dashboard/orders"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Package className="h-4 w-4 mr-2 text-orange-500" />
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white/80 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/seller/dashboard"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/seller/dashboard"
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <Sun className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/seller/products"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/seller/products"
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <Package className="h-5 w-5 mr-3" />
              <span>Products</span>
            </Link>
            <Link
              to="/seller/orders"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/seller/orders"
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <ShoppingBag className="h-5 w-5 mr-3" />
              <span>Orders</span>
            </Link>
            <Link
              to="/seller/customers"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/seller/customers"
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              <span>Customers</span>
            </Link>
            <Link
              to="/seller/messages"
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/seller/messages"
                  ? "bg-orange-100 text-orange-600"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-3" />
              <span>Messages</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// NavItem component is not needed anymore as we simplified the navbar

export default SellerNavbar;
