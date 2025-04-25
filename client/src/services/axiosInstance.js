import axios from "axios";
import { API_URL } from "@/config/constants";
import toast from "react-hot-toast";

const axiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for production stability
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp to prevent caching in GET requests
    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    // Silent logging in production
    if (import.meta.env.MODE !== "production") {
      console.error("Request error:", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error scenarios
    if (!error.response) {
      // Network error
      toast.error("Network error. Please check your connection.");
    } else {
      switch (error.response.status) {
        case 401:
          // Handle unauthorized access
          localStorage.removeItem("token");
          window.location.href = "/login?session=expired";
          break;
        case 403:
          toast.error("You don't have permission to perform this action");
          break;
        case 404:
          // Silently handle 404 in production - may be handled by the component
          if (import.meta.env.MODE !== "production") {
            toast.error("Resource not found");
          }
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          // Get error message from the API or use a generic one
          const errorMessage =
            error.response.data?.message || "Something went wrong";
          toast.error(errorMessage);
      }
    }

    // Silent logging in production
    if (import.meta.env.MODE !== "production") {
      console.error("API Error:", error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
