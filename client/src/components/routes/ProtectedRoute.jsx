import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ProtectedRoute = ({ allowedRoles = [], restrictTo = null }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    toast.error("Please login to access this page");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles
  if (allowedRoles.length > 0) {
    const isAdmin = user.isAdmin || user.role === "admin";
    const isSeller = user.isSeller;

    let hasRequiredRole = false;

    if (allowedRoles.includes("admin") && isAdmin) {
      hasRequiredRole = true;
    } else if (allowedRoles.includes("seller") && isSeller) {
      hasRequiredRole = true;
    } else if (allowedRoles.includes("buyer") && !isAdmin && !isSeller) {
      hasRequiredRole = true;
    }

    if (!hasRequiredRole) {
      toast.error("You don't have permission to access this page");

      // Redirect to the appropriate dashboard based on role
      if (isAdmin) {
        return <Navigate to="/admin" replace />;
      } else if (isSeller) {
        return <Navigate to="/seller/dashboard" replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    }
  }

  // Handle restrictions based on user types
  if (restrictTo === "buyer" && (user.isSeller || user.isAdmin)) {
    toast.error("This page is only accessible to buyers");
    if (user.isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/seller/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
