import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ProtectedRoute = ({ allowedRoles = [], requireAuth = true }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // For routes that require authentication
  if (requireAuth && !user) {
    toast.error("Please login to access this page");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in, handle role-based redirection
  if (user) {
    if (user.isAdmin && !location.pathname.startsWith("/admin")) {
      return <Navigate to="/admin" replace />;
    } else if (user.isSeller && !location.pathname.startsWith("/seller")) {
      return <Navigate to="/seller/dashboard" replace />;
    } else if (
      !user.isAdmin &&
      !user.isSeller &&
      (location.pathname.startsWith("/admin") ||
        location.pathname.startsWith("/seller"))
    ) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
