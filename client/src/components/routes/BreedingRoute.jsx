import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const BreedingRoute = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [redirectPath, setRedirectPath] = useState(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log("BreedingRoute: No user found, redirecting to login");
        toast.error("Please login to access breeding management");
        setRedirectPath("/login");
      } else if (!user.isBuyer) {
        console.log(
          "BreedingRoute: Access denied - seller/admin cannot access breeding management",
          {
            userRole: user.role,
            isSeller: user.isSeller,
            isAdmin: user.isAdmin,
          }
        );
        toast.error("Breeding management is only available for buyers");
        setRedirectPath("/");
      } else {
        console.log("BreedingRoute: Access granted for buyer", {
          userId: user._id,
        });
      }
    }
  }, [user, isLoading]);

  if (isLoading) {
    console.log("BreedingRoute: Loading user data...");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (redirectPath) {
    console.log("BreedingRoute: Redirecting to", redirectPath);
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (!user || !user.isBuyer) {
    return null;
  }

  return <Outlet />;
};

export default BreedingRoute;
