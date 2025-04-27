import React, { createContext, useContext, useState, useEffect } from "react";
import { apiLogin, apiRegister, apiGetCurrentUser } from "../api/auth";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance, { AUTH_ERROR_EVENT } from "@/api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to normalize user data
  const normalizeUserData = (userData) => {
    if (!userData) return null;

    // If _id doesn't exist but id does, use id as _id
    if (!userData._id && userData.id) {
      return {
        ...userData,
        _id: userData.id,
      };
    }
    return userData;
  };

  // Listen for auth errors
  useEffect(() => {
    const handleAuthError = () => {
      setUser(null);
      setError("Session expired. Please login again.");
      if (!location.pathname.match(/^\/(login|register)$/)) {
        toast.error("Session expired. Please login again.");
        navigate("/login", { state: { from: location }, replace: true });
      }
    };

    window.addEventListener(AUTH_ERROR_EVENT, handleAuthError);
    return () => window.removeEventListener(AUTH_ERROR_EVENT, handleAuthError);
  }, [navigate, location]);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiLogin(credentials);
      if (response.token) {
        localStorage.setItem("token", response.token);

        // Normalize user data before validation
        const normalizedUser = normalizeUserData(response.user);

        // Validate normalized user data
        if (!normalizedUser?._id) {
          console.error("Invalid user data received:", response.user);
          throw new Error("Invalid user data received");
        }

        setUser(normalizedUser);
        toast.success("Login successful!");

        // Get the redirect path from state or default to appropriate dashboard
        const from =
          location.state?.from?.pathname || getDefaultRedirect(normalizedUser);
        navigate(from, { replace: true });
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || "Failed to login";
      setError(errorMessage);
      toast.error(errorMessage);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiRegister(userData);
      if (response.token) {
        localStorage.setItem("token", response.token);
        const normalizedUser = normalizeUserData(response.user);
        setUser(normalizedUser);
        toast.success("Registration successful!");
        navigate(getDefaultRedirect(normalizedUser));
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || "Failed to register";
      setError(errorMessage);
      toast.error(errorMessage);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  // Helper function to determine default redirect based on user role
  const getDefaultRedirect = (user) => {
    if (user.isAdmin) return "/admin";
    if (user.isSeller) return "/seller/dashboard";
    return "/";
  };

  // Verify authentication only on mount and token changes
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verifying auth with token...");
        const userData = await apiGetCurrentUser();
        const normalizedUser = normalizeUserData(userData);

        // Validate normalized user data
        if (!normalizedUser?._id) {
          console.error("Invalid user data received:", userData);
          throw new Error("Invalid user data structure");
        }

        setUser(normalizedUser);
      } catch (err) {
        console.error("Token verification error:", err);
        setUser(null);
        localStorage.removeItem("token");

        if (
          err.response?.status === 401 ||
          err.message === "Invalid user data structure"
        ) {
          if (!location.pathname.match(/^\/(login|register)$/)) {
            toast.error("Session expired. Please login again.");
            navigate("/login", { state: { from: location }, replace: true });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []); // Empty dependency array - only run on mount

  // Set up axios interceptor for token expiration
  useEffect(() => {
    const interceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (
          error.response?.status === 401 &&
          !location.pathname.match(/^\/(login|register)$/)
        ) {
          localStorage.removeItem("token");
          setUser(null);
          toast.error("Session expired. Please login again.");
          navigate("/login", {
            state: { from: location },
            replace: true,
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(interceptor);
    };
  }, [navigate, location]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        error,
        isAuthenticated: !!user?._id,
        isSeller: user?.isSeller || false,
        isAdmin: user?.isAdmin || false,
        isBuyer: user && !user.isAdmin && !user.isSeller,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
