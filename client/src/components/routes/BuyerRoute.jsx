import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTE_PATHS } from "@/config/routes";
import toast from "react-hot-toast";

/**
 * Protected route component that ensures only buyers can access certain routes.
 * Redirects non-buyers to appropriate pages based on their role.
 */
const BuyerRoute = () => {
  const { user, isLoading, isBuyer, isSeller, isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Show toast notifications after rendering, not during
    if (user) {
      if (isSeller) {
        toast.error(
          "This area is restricted to buyers only. Redirecting to seller dashboard."
        );
      } else if (isAdmin) {
        toast.error(
          "This area is restricted to buyers only. Redirecting to admin dashboard."
        );
      } else if (!isBuyer) {
        toast.error("Access denied. This area is restricted to buyers only.");
      }
    } else if (!isLoading) {
      toast.error("Please login to access buyer features");
    }
  }, [user, isBuyer, isSeller, isAdmin, isLoading]);

  if (isLoading) {
    return <LoadingSpinner message="Verifying access permissions..." />;
  }

  // If not authenticated, redirect to login
  if (!user) {
    return (
      <Navigate to={ROUTE_PATHS.LOGIN} state={{ from: location }} replace />
    );
  }

  // Role-based redirects
  if (isSeller) {
    return <Navigate to={ROUTE_PATHS.SELLER} replace />;
  }

  if (isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN} replace />;
  }

  // Ensure user is a buyer
  if (!isBuyer) {
    return <Navigate to={ROUTE_PATHS.HOME} replace />;
  }

  return <Outlet />;
};

export default BuyerRoute;
