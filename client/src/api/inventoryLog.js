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

// Update an existing inventory log (real-time qty / name sync)
export const updateInventoryLog = async (id, data) => {
  const response = await axiosInstance.patch(`/inventory-logs/${id}`, data);
  return response.data;
};

// Remove a log entry (unpost)
export const deleteInventoryLog = async (id) => {
  const response = await axiosInstance.delete(`/inventory-logs/${id}`);
  return response.data;
};
