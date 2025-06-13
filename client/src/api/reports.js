import { axiosInstance } from "@/contexts/axios";

/**
 * Submit a new report
 * @param {Object} reportData - The report data
 * @param {string} reportData.reportedUserId - ID of the user being reported
 * @param {string} reportData.reason - Reason for the report
 * @param {string} reportData.description - Detailed description of the issue
 * @param {string} reportData.reporterRole - Role of the reporter (buyer/seller)
 * @param {string} reportData.category - Category of the report
 * @param {Array} reportData.evidence - Optional evidence for the report
 */
export const submitReport = async (reportData) => {
  try {
    const response = await axiosInstance.post("/reports", reportData);
    return response.data;
  } catch (error) {
    console.error("Error submitting report:", error);
    throw error;
  }
};

/**
 * Get all reports for the current user
 */
export const getMyReports = async () => {
  try {
    const response = await axiosInstance.get("/reports/my-reports");
    return response.data;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    throw error;
  }
};

/**
 * Get a specific report by ID
 * @param {string} reportId - The ID of the report to fetch
 */
export const getReport = async (reportId) => {
  try {
    const response = await axiosInstance.get(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};
