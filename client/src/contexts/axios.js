import axios from "axios";

// Create a custom event for auth errors
export const AUTH_ERROR_EVENT = "auth_error";

// Debug the environment variables
console.log("Environment Variables:", {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  PROD: import.meta.env.PROD,
});

// Get the API URL based on environment
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  if (import.meta.env.PROD) {
    return "https://poultrymart-api.onrender.com/api";
  }
  return "http://localhost:3001/api";
};

// Create axios instance with custom config
const axiosInstance = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request details for debugging
    console.log(
      `Request: ${config.method.toUpperCase()} ${config.url}`,
      config
    );

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration and errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Emit auth error event instead of direct redirect
      window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
    } else if (error.response?.status === 405) {
      console.error(
        "Method Not Allowed: The API doesn't support this HTTP method for this endpoint. Check server configuration."
      );
    } else if (error.response?.status === 403) {
      console.error("Access forbidden. Please check your permissions.");
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };
