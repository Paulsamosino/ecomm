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

// Create axios instance with custom config
const axiosInstance = axios.create({
  baseURL: `${getBaseApiUrl()}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout for stability
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event(AUTH_ERROR_EVENT));
      window.location.href = "/login?session=expired";
    }
    return Promise.reject(error);
  }
);

// Function to get API URL for socket connections
export function getApiUrl() {
  return getBaseApiUrl();
}

export default axiosInstance;
