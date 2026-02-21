import axiosInstance from "./axios";

// Fetch all global breeding logs (paginated)
export const getAllBreedingLogs = async (page = 1, limit = 20) => {
  const response = await axiosInstance.get("/breeding-logs", {
    params: { page, limit },
  });
  return response.data;
};

// Post a new breeding log entry after a prediction
export const createBreedingLog = async (data) => {
  const response = await axiosInstance.post("/breeding-logs", data);
  return response.data;
};

// Update an existing breeding log (real-time sync)
export const updateBreedingLog = async (id, data) => {
  const response = await axiosInstance.patch(`/breeding-logs/${id}`, data);
  return response.data;
};

// Remove a breeding log entry
export const deleteBreedingLog = async (id) => {
  const response = await axiosInstance.delete(`/breeding-logs/${id}`);
  return response.data;
};
