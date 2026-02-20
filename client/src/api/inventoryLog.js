import axiosInstance from "./axios";

// Fetch all global inventory logs (paginated)
export const getAllInventoryLogs = async (page = 1, limit = 100) => {
  const response = await axiosInstance.get("/inventory-logs", {
    params: { page, limit },
  });
  return response.data;
};

// Post a new inventory log entry
export const createInventoryLog = async (data) => {
  const response = await axiosInstance.post("/inventory-logs", data);
  return response.data;
};
