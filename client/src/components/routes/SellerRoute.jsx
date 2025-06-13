import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const SellerRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    toast.error("Please login to access the seller dashboard");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated but not a seller, redirect based on role
  if (!user.isSeller) {
    toast.error("Access denied. Seller account required.");
    if (user.isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default SellerRoute;
