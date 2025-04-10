import axios from "./axios";

// Dashboard Statistics
export const getSellerStats = async () => {
  const response = await axios.get("/api/seller/stats");
  return response.data;
};

// Products
export const getSellerProducts = async () => {
  const response = await axios.get("/api/seller/products");
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await axios.post("/api/seller/products", productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await axios.put(
    `/api/seller/products/${productId}`,
    productData
  );
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await axios.delete(`/api/seller/products/${productId}`);
  return response.data;
};

// Orders
export const getSellerOrders = async () => {
  const response = await axios.get("/api/seller/orders");
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await axios.put(`/api/seller/orders/${orderId}`, { status });
  return response.data;
};

// Customers
export const getSellerCustomers = async () => {
  const response = await axios.get("/api/seller/customers");
  return response.data;
};

// Analytics
export const getSellerAnalytics = async () => {
  const response = await axios.get("/api/seller/analytics");
  return response.data;
};

// Reviews
export const getSellerReviews = async () => {
  const response = await axios.get("/api/seller/reviews");
  return response.data;
};
