import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ProtectedRoute = ({ allowedRoles = [] }) => {
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
    const hasRequiredRole = allowedRoles.includes("admin") ? isAdmin : true;

    if (!hasRequiredRole) {
      toast.error("You don't have permission to access this page");
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
