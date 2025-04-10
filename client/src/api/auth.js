import { axiosInstance } from "../contexts/axios";

export const apiLogin = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const apiRegister = async (userData) => {
  const response = await axiosInstance.post("/auth/register", userData);
  return response.data;
};

export const apiRegisterSeller = async (sellerData) => {
  const response = await axiosInstance.post("/auth/register", {
    ...sellerData,
    isSeller: true,
  });
  return response.data;
};

export const apiGetCurrentUser = async () => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

export const apiLogout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const apiUpdateProfile = async (userData) => {
  const response = await axiosInstance.put("/auth/profile", userData);
  return response.data;
};

export const apiChangePassword = async (passwordData) => {
  const response = await axiosInstance.put("/auth/profile", {
    password: passwordData.newPassword,
  });
  return response.data;
};
