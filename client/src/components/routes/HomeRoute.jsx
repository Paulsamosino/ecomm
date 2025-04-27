import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ROUTE_PATHS } from "@/config/routes";

/**
 * Route component for the home page that redirects sellers and admins
 * to their respective dashboards while allowing access to buyers and
 * non-authenticated users.
 */
const HomeRoute = () => {
  const { user, isLoading, isSeller, isAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // If authenticated, redirect sellers and admins to their dashboards
  if (user) {
    if (isSeller) {
      return <Navigate to={ROUTE_PATHS.SELLER} replace />;
    }

    if (isAdmin) {
      return <Navigate to={ROUTE_PATHS.ADMIN} replace />;
    }
  }

  // Allow access to home for buyers and non-authenticated users
  return <Outlet />;
};

export default HomeRoute;
