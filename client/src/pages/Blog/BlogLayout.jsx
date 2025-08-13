import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PenTool, Users, Compass, Sparkles } from "lucide-react";

const TabLink = ({ to, children, icon: Icon }) => (
  <NavLink
    to={to}
    end
  >
    {({ isActive }) => (
      <div className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 group ${
        isActive 
          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 transform scale-105" 
          : "text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:shadow-md"
      }`}>
        <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        {children}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full shadow-lg"></div>
        )}
      </div>
    )}
  </NavLink>
);

const BlogLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If user is a seller, redirect them to seller blog routes
    if (user && (user.role === "seller" || user.isSeller)) {
      const currentPath = location.pathname;
      if (currentPath.startsWith("/blog")) {
        const blogPath = currentPath.replace("/blog", "/seller/blog");
        navigate(blogPath, { replace: true });
        return;
      }
    }

    // If we're exactly on /blog, send authenticated users to feed, others to explore
    if (location.pathname === "/blog") {
      navigate(user ? "/blog/feed" : "/blog/explore", { replace: true });
    }
  }, [location.pathname, navigate, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-20 w-64 h-64 bg-gradient-to-br from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -left-20 w-80 h-80 bg-gradient-to-br from-orange-300/15 to-red-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200/10 to-orange-200/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              Community Hub
            </h1>
            <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Connect with fellow poultry enthusiasts, share knowledge, and discover amazing content from our community
          </p>
        </div>

        {/* Action Button */}
        {!!user && (
          <div className="flex justify-center mb-8">
            <button
              onClick={() => navigate("/blog/new")}
              className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
            >
              <PenTool className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Create New Post
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-3 p-2 bg-white/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20">
            {user && <TabLink to="/blog/feed" icon={Users}>Feed</TabLink>}
            <TabLink to="/blog/explore" icon={Compass}>Explore</TabLink>
            {user && <TabLink to="/blog/new" icon={PenTool}>Write</TabLink>}
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};export default BlogLayout;
