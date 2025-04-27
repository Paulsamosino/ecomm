import axiosInstance from "@/api/axios";

// Get seller dashboard statistics
export const getSellerStats = async () => {
  const response = await axiosInstance.get("/seller/stats");
  return response.data;
};

// Get seller's recent orders
export const getSellerOrders = async () => {
  const response = await axiosInstance.get("/seller/orders");
  return response.data;
};

// Get seller's reviews
export const getSellerReviews = async () => {
  const response = await axiosInstance.get("/seller/reviews");
  return response.data;
};

// Get seller profile
export const getSellerProfile = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// Products
export const getSellerProducts = async () => {
  const response = await axiosInstance.get("/seller/products");
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await axiosInstance.post("/seller/products", productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await axiosInstance.put(
    `/seller/products/${productId}`,
    productData
  );
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axiosInstance.delete(`/seller/products/${productId}`);
  return response.data;
};

// Customers
export const getSellerCustomers = async () => {
  const response = await axiosInstance.get("/seller/customers");
  return response.data;
};

// Analytics
export const getSellerAnalytics = async () => {
  const response = await axiosInstance.get("/seller/analytics");
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axiosInstance.put(`/seller/orders/${orderId}`, {
    status,
  });
  return response.data;
};
