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
