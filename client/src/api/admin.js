import axiosInstance from "./axios";

// Get all users
export const apiGetAllUsers = async () => {
  const response = await axiosInstance.get("/admin/users");
  return response.data;
};

// Update user role
export const apiUpdateUserRole = async (userId, role) => {
  const response = await axiosInstance.put(`/admin/users/${userId}/role`, {
    role,
  });
  return response.data;
};

// Delete user
export const apiDeleteUser = async (userId) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};

// Get admin dashboard stats
export const apiGetAdminStats = async () => {
  const response = await axiosInstance.get("/admin/stats");
  return response.data;
};

// Get all listings/products
export const apiGetAllListings = async () => {
  const response = await axiosInstance.get("/admin/products");
  return response.data;
};

// Update listing status
export const apiUpdateListingStatus = async (listingId, status) => {
  const response = await axiosInstance.put(
    `/admin/products/${listingId}/status`,
    { status }
  );
  return response.data;
};

// Delete listing
export const apiDeleteListing = async (listingId) => {
  const response = await axiosInstance.delete(`/admin/products/${listingId}`);
  return response.data;
};

// Get analytics data with period parameter
export const apiGetAnalytics = async (period = "week") => {
  const response = await axiosInstance.get(`/admin/analytics?period=${period}`);
  return response.data;
};

// Get platform settings
export const apiGetSettings = async () => {
  const response = await axiosInstance.get("/admin/settings");
  return response.data;
};

// Update platform settings
export const apiUpdateSettings = async (settings) => {
  const response = await axiosInstance.put("/admin/settings", settings);
  return response.data;
};

// Get all reports
export const apiGetReports = async () => {
  const response = await axiosInstance.get("/admin/reports");
  return response.data;
};

// Update report status
export const apiUpdateReportStatus = async (reportId, status, resolution) => {
  const response = await axiosInstance.put(
    `/admin/reports/${reportId}/status`,
    {
      status,
      resolution,
    }
  );
  return response.data;
};

// Get report stats
export const apiGetReportStats = async () => {
  const response = await axiosInstance.get("/admin/reports/stats");
  return response.data;
};
