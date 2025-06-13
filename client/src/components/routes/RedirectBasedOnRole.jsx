import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const RedirectBasedOnRole = () => {
  const { user } = useAuth();

  if (user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  } else if (user?.isSeller) {
    return <Navigate to="/seller/dashboard" replace />;
  } else {
    return <Navigate to="/buyer-dashboard" replace />;
  }
};

export default RedirectBasedOnRole;
