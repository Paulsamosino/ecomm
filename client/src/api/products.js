import { axiosInstance } from "@/contexts/axios";

export const apiAddProduct = async (productData) => {
  const response = await axiosInstance.post("/products", productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const apiGetProducts = async (queryParams) => {
  const response = await axiosInstance.get("/products", {
    params: queryParams,
  });
  return response.data;
};

export const apiGetProduct = async (id) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

export const apiUpdateProduct = async (id, productData) => {
  const response = await axiosInstance.put(`/products/${id}`, productData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const apiDeleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

export const apiGetSellerProducts = async () => {
  const response = await axiosInstance.get("/products/seller");
  return response.data;
};

export const apiAddReview = async (productId, reviewData) => {
  const response = await axiosInstance.post(
    `/products/${productId}/reviews`,
    reviewData
  );
  return response.data;
};

export const apiGetProductReviews = async (productId) => {
  const response = await axiosInstance.get(`/products/${productId}/reviews`);
  return response.data;
};

export const apiCanReviewProduct = async (productId) => {
  const response = await axiosInstance.get(`/products/${productId}/can-review`);
  return response.data;
};
