// Configure API URL based on environment
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === "production"
    ? "https://poultrymart-api.onrender.com"
    : "http://localhost:3001");

// Socket URL for real-time communication
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;

// Platform configuration constants
export const PLATFORM_FEE_PERCENTAGE = 5;
export const DEFAULT_CURRENCY = "₱";
export const SHIPPING_FEE = 150;

// Feature flags - can be toggled for production/development
export const FEATURES = {
  ENABLE_CHAT: true,
  ENABLE_PAYPAL: true,
  ENABLE_ANALYTICS: true,
  ENABLE_REPORTS: true,
  ENABLE_BREEDING_MANAGER: true,
};
