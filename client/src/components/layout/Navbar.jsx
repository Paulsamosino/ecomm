import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  Home,
  Package,
  MessageSquare,
  BarChart,
  Users,
  Search,
  Heart,
  ChevronDown,
  Bell,
  Store,
  ChevronUp,
  Info,
  HelpCircle,
} from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount, wishlistItems } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    setIsUserMenuOpen(false);
    setIsCategoriesOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };

  // Mobile navigation items for unauthenticated users
  const unauthenticatedMobileItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/products", icon: Package, label: "Products" },
    { to: "/help-center", icon: HelpCircle, label: "Help Center" },
  ];

  // Notifications count - would be dynamic in a real app
  const notificationCount = isAuthenticated ? 2 : 0;

  // Use safe access for user properties
  const userRole = user?.role || "";
  const userName = user?.name || "";
  const userEmail = user?.email || "";
  const wishlistCount = isAuthenticated ? wishlistItems?.length || 0 : 0;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary mr-2">C&P</span>
              <span className="hidden md:inline-block text-sm font-medium text-gray-600">
                Chicken & Poultry
              </span>
            </Link>

            {/* Primary Navigation - Desktop */}
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <NavItem to="/" active={location.pathname === "/"}>
                Home
              </NavItem>
              <NavItem
                to="/products"
                active={location.pathname === "/products"}
              >
                Browse Products
              </NavItem>
              {isAuthenticated ? (
                <>
                  <NavItem to="/chat" active={location.pathname === "/chat"}>
                    Messages
                  </NavItem>
                  <NavItem
                    to="/help-center"
                    active={location.pathname === "/help-center"}
                  >
                    Help Center
                  </NavItem>
                </>
              ) : (
                <NavItem
                  to="/help-center"
                  active={location.pathname === "/help-center"}
                >
                  Help Center
                </NavItem>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative mr-4">
              <input
                type="text"
                placeholder="Search products..."
                className="w-40 lg:w-64 py-1.5 px-3 pr-8 rounded-full border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* User related links */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Wishlist */}
                <Link
                  to="/wishlist"
                  className="text-gray-700 hover:text-primary relative"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Shopping Cart */}
                <Link
                  to="/cart"
                  className="text-gray-700 hover:text-primary relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center text-gray-700 hover:text-primary"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {userName ? (
                        userName.charAt(0).toUpperCase()
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                      <div className="px-4 py-2 text-xs text-gray-500">
                        Signed in as
                      </div>
                      <div className="px-4 py-1 text-sm font-medium">
                        {userEmail}
                      </div>
                      <div className="border-t border-gray-100 my-1"></div>

                      {userRole === "seller" && (
                        <Link
                          to="/seller"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Seller Dashboard
                        </Link>
                      )}

                      {userRole === "buyer" && (
                        <Link
                          to="/buyer-dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          My Account
                        </Link>
                      )}

                      {userRole === "admin" && (
                        <Link
                          to="/admin-dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Orders
                      </Link>

                      <Link
                        to="/chat"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Messages
                      </Link>

                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/90 font-medium"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Search form - mobile */}
            <form onSubmit={handleSearch} className="relative mb-3 px-3">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full py-2 px-4 pr-10 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>

            <MobileNavItem to="/" active={location.pathname === "/"}>
              <Home className="h-5 w-5 mr-2" />
              Home
            </MobileNavItem>
            <MobileNavItem
              to="/products"
              active={location.pathname === "/products"}
            >
              <Package className="h-5 w-5 mr-2" />
              Products
            </MobileNavItem>
            <MobileNavItem
              to="/help-center"
              active={location.pathname === "/help-center"}
            >
              <HelpCircle className="h-5 w-5 mr-2" />
              Help Center
            </MobileNavItem>

            <div className="border-t border-gray-200 my-2"></div>
            <Link
              to="/login"
              className="flex items-center px-3 py-2 text-primary font-medium"
            >
              <User className="mr-2 h-5 w-5" />
              Sign In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// Desktop Nav Item
const NavItem = ({ children, to, active }) => (
  <Link
    to={to}
    className={`py-2 px-3 text-sm font-medium transition-colors ${
      active ? "text-primary" : "text-gray-700 hover:text-primary"
    }`}
  >
    {children}
  </Link>
);

// Mobile Nav Item
const MobileNavItem = ({ children, to, active }) => (
  <Link
    to={to}
    className={`flex items-center px-3 py-2 text-base font-medium ${
      active ? "text-primary" : "text-gray-700 hover:text-primary"
    }`}
  >
    {children}
  </Link>
);

export default Navbar;
