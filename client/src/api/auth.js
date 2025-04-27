import axiosInstance from "./axios";

/**
 * Authenticate user and get token
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User email address
 * @param {string} credentials.password - User password
 * @returns {Promise<Object>} Response containing user data and authentication token
 */
export const apiLogin = async (credentials) => {
  try {
    const response = await axiosInstance.post("/auth/login", credentials);

    // Validate response structure
    if (!response.data || !response.data.token || !response.data.user) {
      console.error("Invalid login response structure:", response.data);
      throw new Error(
        "Server returned an invalid response. Please try again later."
      );
    }

    return {
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error) {
    console.error("Login API error:", error);

    // Handle specific error cases
    if (error.response) {
      // Server returned an error response
      const status = error.response.status;
      const responseData = error.response.data;

      if (status === 429) {
        throw new Error(
          "Too many login attempts. Please try again in a few minutes."
        );
      } else if (status === 401) {
        throw new Error(
          responseData?.message ||
            "Invalid credentials. Please check your email and password."
        );
      } else if (status >= 500) {
        throw new Error("Server error. Please try again later.");
      } else if (responseData?.message) {
        throw new Error(responseData.message);
      }
    }

    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {boolean} [userData.isSeller] - Whether user is registering as a seller
 * @param {boolean} [userData.isAdmin] - Whether user is an admin (typically not set directly)
 * @param {Object} [userData.businessName] - Business name for sellers
 * @param {Object} [userData.address] - User's address information
 * @returns {Promise<Object>} Response containing new user data and authentication token
 */
export const apiRegister = async (userData) => {
  try {
    const response = await axiosInstance.post("/auth/register", userData);
    return {
      user: response.data.user,
      token: response.data.token,
    };
  } catch (error) {
    console.error("Register API error:", error);
    throw error;
  }
};

/**
 * Get current user data using stored JWT
 * @returns {Promise<Object>} Current user data
 */
export const apiGetCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/me");
    return response.data;
  } catch (error) {
    console.error("Get current user API error:", error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - User profile data to update
 * @returns {Promise<Object>} Updated user data
 */
export const apiUpdateProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put("/auth/profile", profileData);
    return response.data;
  } catch (error) {
    console.error("Update profile API error:", error);
    throw error;
  }
};

/**
 * Update seller profile
 * @param {Object} profileData - Seller profile data to update
 * @returns {Promise<Object>} Updated seller data
 */
export const apiUpdateSellerProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put(
      "/auth/seller-profile",
      profileData
    );
    return response.data;
  } catch (error) {
    console.error("Update seller profile API error:", error);
    throw error;
  }
};

/**
 * Log out current user (invalidate token on server)
 * @returns {Promise<Object>} Logout response
 */
export const apiLogout = async () => {
  try {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout API error:", error);
    // We still want to clear local session even if the server request fails
    return { success: true, message: "Logged out locally" };
  }
};
