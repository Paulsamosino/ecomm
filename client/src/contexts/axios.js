import axios from "axios";

// Create a custom event for auth errors
export const AUTH_ERROR_EVENT = "auth_error";

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api`,
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
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      // Emit auth error event instead of direct redirect
      window.dispatchEvent(new CustomEvent(AUTH_ERROR_EVENT));
    } else if (error.response?.status === 403) {
      console.error("Access forbidden. Please check your permissions.");
    }
    return Promise.reject(error);
  }
);

export { axiosInstance };
