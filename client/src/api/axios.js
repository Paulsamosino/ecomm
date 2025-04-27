import axios from "axios";
import { API_URL } from "@/config/constants";

// Custom event for authentication errors
export const AUTH_ERROR_EVENT = "auth_error";

// Get the API URL based on environment with fallback
const getBaseApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return API_URL;
};

// Retry configuration for production
const RETRY_CONFIG = {
  retries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 5000,
};

// Create axios instance with custom config
const axiosInstance = axios.create({
  baseURL: `${getBaseApiUrl()}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: import.meta.env.MODE === "production" ? 60000 : 30000, // Longer timeout in production
  validateStatus: (status) => status >= 200 && status < 500, // Don't reject if status < 500
});

// Request interceptor for adding auth token and retry logic
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add auth token
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add retry configuration
    config.metadata = {
      startTime: new Date().getTime(),
      retryCount: 0,
    };

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and retries
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // If we don't have config, or we've already retried too many times, reject
    if (
      !config ||
      !config.metadata ||
      config.metadata.retryCount >= RETRY_CONFIG.retries
    ) {
      // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.dispatchEvent(new Event(AUTH_ERROR_EVENT));
        window.location.href = "/login?session=expired";
        return Promise.reject(error);
      }

      // Handle server errors
      if (error.response?.status >= 500) {
        console.error("Server error:", error.response?.data || error.message);
        // You might want to notify your error reporting service here
      }

      return Promise.reject(error);
    }

    // Calculate delay using exponential backoff
    const delayMs = Math.min(
      RETRY_CONFIG.initialDelayMs * Math.pow(2, config.metadata.retryCount),
      RETRY_CONFIG.maxDelayMs
    );

    config.metadata.retryCount++;

    // Log retry attempt in production
    if (import.meta.env.MODE === "production") {
      console.log(
        `Retrying request (attempt ${config.metadata.retryCount}/${RETRY_CONFIG.retries})`
      );
    }

    // Wait for the delay
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Retry the request
    return axiosInstance(config);
  }
);

// Function to get API URL for socket connections
export function getApiUrl() {
  return getBaseApiUrl();
}

export default axiosInstance;
