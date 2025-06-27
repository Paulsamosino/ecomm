import axiosInstance from "./axiosInstance";

const deliveryService = {
  // Get delivery quotation
  async getQuotation(data) {
    try {
      const response = await axiosInstance.post("/api/delivery/quote", data);
      return response.data;
    } catch (error) {
      console.error("Error getting delivery quotation:", error);
      throw error;
    }
  },

  // Create delivery order
  async createDeliveryOrder(data) {
    try {
      const response = await axiosInstance.post("/api/delivery/create", data);
      return response.data;
    } catch (error) {
      console.error("Error creating delivery order:", error);
      throw error;
    }
  },

  // Get delivery status
  async getDeliveryStatus(orderId) {
    try {
      const response = await axiosInstance.get(
        `/api/delivery/${orderId}/status`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting delivery status:", error);
      throw error;
    }
  },

  // Get driver information
  async getDriverInfo(orderId) {
    try {
      const response = await axiosInstance.get(
        `/api/delivery/${orderId}/driver`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting driver information:", error);
      throw error;
    }
  },

  // Cancel delivery
  async cancelDelivery(orderId) {
    try {
      const response = await axiosInstance.delete(`/api/delivery/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      throw error;
    }
  },

  // Helper function to format coordinates
  formatCoordinates(address) {
    // TODO: Integrate with a geocoding service to convert address to coordinates
    // For now, returning dummy coordinates for testing
    return {
      lat: 14.5995, // Default Manila coordinates
      lng: 120.9842,
    };
  },

  // Helper function to format address for Lalamove
  formatAddress(address) {
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`;
  },
};

export default deliveryService;
