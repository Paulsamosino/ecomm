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

// Get all orders (for admin analytics)
export const apiGetAllOrders = async () => {
  const response = await axiosInstance.get("/admin/orders");
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

// Process refund decision for order by admin
export const apiProcessRefundDecision = async (orderId, decision, reason = '') => {
  const response = await axiosInstance.post(`/admin/orders/${orderId}/refund-decision`, { status: decision, reason });
  return response.data;
};

// Advertisement Management APIs
export const apiGetAds = async () => {
  const response = await axiosInstance.get("/admin/ads");
  return response.data;
};

export const apiCreateAd = async (adData) => {
  const response = await axiosInstance.post("/admin/ads", adData);
  return response.data;
};

export const apiUpdateAd = async (adId, adData) => {
  const response = await axiosInstance.put(`/admin/ads/${adId}`, adData);
  return response.data;
};

export const apiDeleteAd = async (adId) => {
  const response = await axiosInstance.delete(`/admin/ads/${adId}`);
  return response.data;
};

export const apiGetAdStats = async (adId) => {
  const response = await axiosInstance.get(`/admin/ads/${adId}/stats`);
  return response.data;
};

export const apiUpdateAdStatus = async (adId, status) => {
  const response = await axiosInstance.put(`/admin/ads/${adId}/status`, { status });
  return response.data;
};

// Track ad click
export const apiTrackAdClick = async (adId) => {
  const response = await axiosInstance.post(`/ads/${adId}/click`);
  return response.data;
};

// Track ad impression
export const apiTrackAdImpression = async (adId) => {
  const response = await axiosInstance.post(`/ads/${adId}/impression`);
  return response.data;
};

// Get active ads for display (public endpoint)
export const apiGetActiveAds = async (type = 'banner') => {
  const response = await axiosInstance.get(`/ads/active?type=${type}`);
  return response.data;
};

// Get comprehensive ad analytics
export const apiGetAdAnalytics = async (adId, period = 'week') => {
  const response = await axiosInstance.get(`/admin/ads/${adId}/analytics?period=${period}`);
  return response.data;
};

// Upload ad image
export const apiUploadAdImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await axiosInstance.post('/admin/ads/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Blog Management Functions
export const apiGetAllPosts = async (params = {}) => {
  const response = await axiosInstance.get("/blog", { params });
  return response.data;
};

export const apiGetBlogStats = async () => {
  const response = await axiosInstance.get("/admin/blog/stats");
  return response.data;
};

// Maintenance endpoints
export const apiGetMaintenance = async () => {
  const response = await axiosInstance.get('/admin/maintenance');
  return response.data;
};

// body: { maintenance: boolean, graceMinutes?: number }
export const apiSetMaintenance = async (body) => {
  const response = await axiosInstance.post('/admin/maintenance', body);
  return response.data;
};

export const apiUpdatePostStatus = async (postId, status) => {
  const response = await axiosInstance.put(`/blog/${postId}`, { status });
  return response.data;
};

export const apiDeletePost = async (postId) => {
  const response = await axiosInstance.delete(`/blog/${postId}`);
  return response.data;
};

export const apiGetPostById = async (postId) => {
  const response = await axiosInstance.get(`/blog/post/${postId}`);
  return response.data;
};

// Transactions
export const apiGetTransactions = async (params = {}) => {
  const response = await axiosInstance.get('/admin/transactions', { params });
  return response.data;
};

export const apiGetTransaction = async (id) => {
  const response = await axiosInstance.get(`/admin/transactions/${id}`);
  return response.data;
};

// User credential management
export const apiResetUserCredentials = async (userId) => {
  const response = await axiosInstance.post(`/admin/users/${userId}/reset-credentials`);
  return response.data;
};

export const apiUpdateUserCredentials = async (userId, payload) => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/credentials`, payload);
  return response.data;
};

// ─── Breeding Preset Management ──────────────────────────────────────────────

// Used by BreedingManagementPage (public — any logged-in user)
export const apiGetPublicBreedingPresets = async () => {
  const response = await axiosInstance.get("/admin/presets/public");
  return response.data;
};

// Admin-only preset management
export const apiGetBreedingPresets = async () => {
  const response = await axiosInstance.get("/admin/presets");
  return response.data;
};

export const apiCreateBreedingPreset = async (data) => {
  const response = await axiosInstance.post("/admin/presets", data);
  return response.data;
};

export const apiUpdateBreedingPreset = async (id, data) => {
  const response = await axiosInstance.put(`/admin/presets/${id}`, data);
  return response.data;
};

export const apiDeleteBreedingPreset = async (id) => {
  const response = await axiosInstance.delete(`/admin/presets/${id}`);
  return response.data;
};

// Upload a preset image (admin only)
export const apiUploadPresetImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await axiosInstance.post("/upload/preset-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data; // { imageUrl, imagePublicId }
};

