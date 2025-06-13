import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";

const HomeRedirect = () => {
  const { user } = useAuth();

  // If user is a seller, redirect to seller dashboard
  if (user?.isSeller) {
    return <Navigate to="/seller/dashboard" replace />;
  }

  // If user is an admin, redirect to admin dashboard
  if (user?.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // For buyers and non-authenticated users, show the homepage
  return <HomePage />;
};

export default HomeRedirect;
