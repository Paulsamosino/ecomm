import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import toast from "react-hot-toast";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  Package,
  Search,
  Heart,
  ChevronDown,
  Bell,
  HelpCircle,
  Egg,
  Wheat,
  Sun,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import { Home } from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount, wishlistItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    logout();
  };

  // Notifications count
  const wishlistCount = isAuthenticated ? wishlistItems?.length || 0 : 0;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 shadow-lg"
          : "bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-white mr-2">C&P</span>
              <span className="hidden md:inline-block text-sm font-medium text-white">
                Chicken & Poultry
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4 ml-8">
              <Link to="/" className="text-white hover:text-white/90">
                Home
              </Link>
              <Link to="/products" className="text-white hover:text-white/90">
                Browse Products
              </Link>
              <Link
                to="/help-center"
                className="text-white hover:text-white/90"
              >
                Help Center
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-40 lg:w-64 py-1.5 px-3 pr-8 rounded-full border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-sm bg-white/10 backdrop-blur-sm text-white placeholder-white/70 transition-all duration-200 hover:bg-white/15 focus:bg-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Cart */}
            <Link to="/cart" className="relative group">
              <ShoppingCart className="h-6 w-6 text-white" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-300 text-xs flex items-center justify-center font-medium text-orange-600">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="relative group">
                <Heart className="h-6 w-6 text-white" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-300 text-xs flex items-center justify-center font-medium text-orange-600">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <ProfileAvatar user={user} size="sm" />
                  <ChevronDown className="h-4 w-4 text-white" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email || ""}
                        </p>
                      </div>
                      <Link
                        to={
                          user?.isSeller
                            ? "/seller/settings"
                            : "/buyer-dashboard/profile"
                        }
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-2 text-orange-500" />
                        My Account
                      </Link>
                      <Link
                        to={
                          user?.isSeller
                            ? "/seller/orders"
                            : "/buyer-dashboard/purchases"
                        }
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
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-white hover:text-white/80 font-medium text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-orange-600 hover:bg-white/90 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-white" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-300 text-xs flex items-center justify-center font-medium text-orange-600">
                  {cartItemCount}
                </span>
              )}
            </Link>

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

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Links */}
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/"
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:bg-orange-50"
                }`}
              >
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-3" />
                  <span>Home</span>
                </div>
              </Link>
              <Link
                to="/products"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/products"
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:bg-orange-50"
                }`}
              >
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-3" />
                  <span>Browse Products</span>
                </div>
              </Link>
              <Link
                to="/help-center"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === "/help-center"
                    ? "bg-orange-100 text-orange-600"
                    : "text-gray-600 hover:bg-orange-50"
                }`}
              >
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-3" />
                  <span>Help Center</span>
                </div>
              </Link>

              {/* Search bar */}
              <form onSubmit={handleSearch} className="px-3 py-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full py-2 px-3 pr-10 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* User-specific links */}
              {isAuthenticated ? (
                <>
                  <Link
                    to={
                      user?.isSeller
                        ? "/seller/settings"
                        : "/buyer-dashboard/profile"
                    }
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-orange-50"
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3" />
                      <span>My Account</span>
                    </div>
                  </Link>
                  <Link
                    to={
                      user?.isSeller
                        ? "/seller/orders"
                        : "/buyer-dashboard/purchases"
                    }
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-orange-50"
                  >
                    <div className="flex items-center">
                      <Package className="h-5 w-5 mr-3" />
                      <span>My Orders</span>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-3" />
                      <span>Sign out</span>
                    </div>
                  </button>
                </>
              ) : (
                <div className="px-3 py-2 space-y-2">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 rounded-lg border border-orange-200 text-orange-600 font-medium hover:bg-orange-50"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Additional sections from image */}
              <div className="px-2 py-3 space-y-3">
                <div className="flex items-center justify-center px-3 py-2 rounded-md bg-orange-50 text-orange-600 text-base font-medium">
                  <span className="mr-2">🚚</span> Fast Delivery
                </div>
                <div className="flex items-center justify-center px-3 py-2 rounded-md bg-orange-50 text-orange-600 text-base font-medium">
                  <span className="mr-2">✅</span> Verified Sellers
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* Statistics from image */}
              <div className="px-2 py-3 grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center justify-center p-4 rounded-md bg-gray-100">
                  <span className="text-xl font-bold text-gray-800">203</span>
                  <span className="text-sm text-gray-600">Total Products</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 rounded-md bg-gray-100">
                  <span className="text-xl font-bold text-gray-800">5</span>
                  <span className="text-sm text-gray-600">Locations</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
