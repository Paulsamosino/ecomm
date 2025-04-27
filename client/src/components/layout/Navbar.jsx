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
  ClipboardList,
  Book,
  Shield,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    setIsCategoriesOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      console.log("Navbar: Search attempted with empty query");
      return;
    }
    console.log("Navbar: Searching for:", searchQuery);
    navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    console.log("Navbar: User logout initiated");
    logout();
    toast.success("Logged out successfully");
  };

  // Helper function to check if a route is accessible
  const canAccessRoute = (route) => {
    if (route === "/breeding-management") {
      if (!user) {
        console.log("Navbar: Breeding management access denied - no user");
        return false;
      }
      if (user.isSeller || user.isAdmin) {
        console.log("Navbar: Breeding management access denied - seller/admin");
        return false;
      }
      console.log("Navbar: Breeding management access granted for buyer");
      return true;
    }
    return true;
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

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <UserMenu />
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
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="flex items-center px-3 py-2 text-primary font-medium"
              >
                <User className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-3 py-2 text-red-600 font-medium"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// Desktop Nav Item
const NavItem = React.forwardRef(
  ({ children, to, active, className, ...props }, ref) => (
    <Link
      ref={ref}
      to={to}
      className={`py-2 px-3 text-sm font-medium transition-colors ${
        active ? "text-primary" : "text-gray-700 hover:text-primary"
      } ${className || ""}`}
      {...props}
    >
      {children}
    </Link>
  )
);
NavItem.displayName = "NavItem";

// Mobile Nav Item
const MobileNavItem = React.forwardRef(
  ({ children, to, active, className, ...props }, ref) => (
    <Link
      ref={ref}
      to={to}
      className={`flex items-center px-3 py-2 text-base font-medium ${
        active ? "text-primary" : "text-gray-700 hover:text-primary"
      } ${className || ""}`}
      {...props}
    >
      {children}
    </Link>
  )
);
MobileNavItem.displayName = "MobileNavItem";

const UserMenu = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { cartItemCount, wishlistItems } = useCart();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Use safe access for user properties
  const userRole = user?.role || "";
  const userName = user?.name || "";
  const userEmail = user?.email || "";
  const wishlistCount = isAuthenticated ? wishlistItems?.length || 0 : 0;

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
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
          <div className="px-4 py-2 text-xs text-gray-500">Signed in as</div>
          <div className="px-4 py-1 text-sm font-medium">{userEmail}</div>

          <div className="border-t border-gray-100 my-1"></div>

          {/* Main Navigation Items */}
          {!user?.isSeller && !user?.isAdmin && (
            <>
              <Link
                to="/buyer/breeding"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <path d="M9 20.5L2.5 14 9 7.5" />
                  <path d="M15 7.5l6.5 6.5-6.5 6.5" />
                </svg>
                Breeding Management
              </Link>
            </>
          )}

          <Link
            to="/buyer/dashboard/purchases"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            My Purchases
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Heart className="h-4 w-4 mr-2" />
            Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
          </Link>

          <Link
            to="/cart"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Cart {cartItemCount > 0 && `(${cartItemCount})`}
          </Link>

          {/* Role-specific sections */}
          {userRole === "seller" && (
            <Link
              to="/seller"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Store className="h-4 w-4 mr-2" />
              Seller Dashboard
            </Link>
          )}

          {userRole === "admin" && (
            <Link
              to="/admin-dashboard"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Shield className="h-4 w-4 mr-2" />
              Admin Dashboard
            </Link>
          )}

          <div className="border-t border-gray-100 my-1"></div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
