import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useBuyerNotifications } from "@/contexts/BuyerNotificationContext";
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
  Sun,
  Egg,
  Newspaper,
  Rss,
  PenSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ProfileAvatar from "@/components/ui/ProfileAvatar";
import NotificationDropdown from "@/components/common/NotificationDropdown";
import { Home } from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount, wishlistItems } = useCart();
  // Conditionally get notifications based on user type
  let unreadCount = 0;
  try {
    if (isAuthenticated && !user?.isSeller) {
      const buyerNotifications = useBuyerNotifications();
      unreadCount = buyerNotifications?.unreadCount || 0;
    }
  } catch (error) {
    // If notification context is not available, default to 0
    unreadCount = 0;
  }
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isMobileNotificationMenuOpen, setIsMobileNotificationMenuOpen] = useState(false);
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

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Close user dropdown
      if (isUserMenuOpen && !event.target.closest('.user-dropdown')) {
        setIsUserMenuOpen(false);
      }
      // Close desktop notification dropdown
      if (isNotificationMenuOpen && !event.target.closest('.notification-dropdown')) {
        setIsNotificationMenuOpen(false);
      }
      // Close mobile notification dropdown
      if (isMobileNotificationMenuOpen && !event.target.closest('.mobile-notification-dropdown')) {
        setIsMobileNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isNotificationMenuOpen, isMobileNotificationMenuOpen]);

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
              <Link to="/blog" className="text-white hover:text-white/90">
                Blog
              </Link>
              {/* Breeding Simulator moved into user dropdown */}
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

            {/* Tools hub shortcut (Inventory + Breeding + Records) */}
            {isAuthenticated && (
              <Link to="/tools" className="relative group">
                <Package className="h-6 w-6 text-white" />
              </Link>
            )}

            {/* Notifications - Only for authenticated buyers */}
            {/* Notifications - Only for authenticated buyers */}
            {isAuthenticated && !user?.isSeller && (
              <div className="relative notification-dropdown">
                <button
                  onClick={() => setIsNotificationMenuOpen(!isNotificationMenuOpen)}
                  className="relative group focus:outline-none flex items-center"
                >
                  <Bell className="h-6 w-6 text-white align-middle" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center font-medium text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationDropdown 
                  isOpen={isNotificationMenuOpen} 
                  onClose={() => setIsNotificationMenuOpen(false)} 
                />
              </div>
            )}            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative user-dropdown">
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
                        to="/blog"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Newspaper className="h-4 w-4 mr-2 text-orange-500" />
                        Blog
                      </Link>
                      <Link
                        to="/blog/feed"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Rss className="h-4 w-4 mr-2 text-orange-500" />
                        My Feed
                      </Link>
                      <Link
                        to="/blog/new"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <PenSquare className="h-4 w-4 mr-2 text-orange-500" />
                        Write Post
                      </Link>
                      {/* Tools hub entry in user dropdown */}
                      <Link
                        to="/tools"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Package className="h-4 w-4 mr-2 text-orange-500" />
                        Tools
                      </Link>
                      {!user?.isSeller && (
                        <Link
                          to="/buyer-dashboard/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-2 text-orange-500" />
                          My Account
                        </Link>
                      )}
                      {!user?.isSeller && (
                        <Link
                          to="/buyer-dashboard/wallet"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <svg className="h-4 w-4 mr-2 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Wallet
                        </Link>
                      )}
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
            {/* Notifications - Mobile */}
            {isAuthenticated && !user?.isSeller && (
              <div className="relative mobile-notification-dropdown">
                <button
                  onClick={() => setIsMobileNotificationMenuOpen(!isMobileNotificationMenuOpen)}
                  className="relative focus:outline-none flex items-center"
                >
                  <Bell className="h-6 w-6 text-white align-middle" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs flex items-center justify-center font-medium text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown - Mobile */}
                <NotificationDropdown 
                  isOpen={isMobileNotificationMenuOpen} 
                  onClose={() => setIsMobileNotificationMenuOpen(false)} 
                />
              </div>
            )}

            {/* Wishlist */}
            {isAuthenticated && (
              <Link to="/wishlist" className="relative">
                <Heart className="h-6 w-6 text-white" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-300 text-xs flex items-center justify-center font-medium text-orange-600">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Tools hub shortcut on mobile */}
            {isAuthenticated && (
              <Link to="/tools" className="relative">
                <Package className="h-6 w-6 text-white" />
              </Link>
            )}

            {/* Cart */}
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
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-orange-200">
            <div className="px-4 py-4 space-y-3">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full py-3 px-4 pr-12 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 placeholder-gray-500 bg-white"
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

              {/* Navigation Links */}
              <Link
                to="/"
                className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
              >
                <Home className="h-5 w-5 mr-3 text-orange-500" />
                Home
              </Link>

              <Link
                to="/products"
                className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
              >
                <Package className="h-5 w-5 mr-3 text-orange-500" />
                Products
              </Link>

              <Link
                to="/blog"
                className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
              >
                <Newspaper className="h-5 w-5 mr-3 text-orange-500" />
                Blog
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/blog/feed"
                    className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
                  >
                    <Rss className="h-5 w-5 mr-3 text-orange-500" />
                    My Feed
                  </Link>
                  <Link
                    to="/blog/new"
                    className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
                  >
                    <PenSquare className="h-5 w-5 mr-3 text-orange-500" />
                    Write Post
                  </Link>
                </>
              )}

              {/* Breeding Simulator moved into user dropdown; keep a quick link here on mobile if desired */}

              {isAuthenticated && (
                <Link
                  to={
                    user?.isSeller
                      ? "/seller/dashboard"
                      : "/buyer-dashboard"
                  }
                  className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
                >
                  <User className="h-5 w-5 mr-3 text-orange-500" />
                  Dashboard
                </Link>
              )}

              <Link
                to="/help-center"
                className="flex items-center px-4 py-3 rounded-lg text-gray-700 font-medium hover:bg-orange-50 transition-all"
              >
                <HelpCircle className="h-5 w-5 mr-3 text-orange-500" />
                Help
              </Link>

              {/* Auth Section */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                {isAuthenticated ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/login"
                      className="block w-full text-center px-4 py-3 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 transition-all"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center px-4 py-3 rounded-lg border border-orange-200 text-orange-600 font-medium hover:bg-orange-50 transition-all"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
