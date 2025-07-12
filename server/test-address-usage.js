require("dotenv").config();
const deliveryController = require("./src/controllers/deliveryController");

// Mock order for testing
const mockOrder = {
  _id: "test-order-id",
  items: [
    {
      product: { name: "Test Chicken" },
      quantity: 1,
      price: 100
    }
  ],
  buyer: {
    name: "John Doe"
  },
  seller: {
    name: "Farm Store",
    phone: "+639171234567"
  },
  shippingAddress: {
    street: "123 Test Street",
    city: "Makati",
    state: "Metro Manila",
    zipCode: "1234",
    country: "Philippines",
    phone: "+639123456789"
  }
};

console.log("Testing delivery controller with real address:");
console.log("Shipping Address:", mockOrder.shippingAddress);

// Test the geocoding function
const coords = deliveryController._getCoordinatesForCity("Makati", "Metro Manila");
console.log("Coordinates for Makati:", coords);

const coords2 = deliveryController._getCoordinatesForCity("Cebu", "Cebu Province");
console.log("Coordinates for Cebu:", coords2);

const coords3 = deliveryController._getCoordinatesForCity("Unknown City", "Unknown State");
console.log("Coordinates for Unknown City (should default to Manila):", coords3);
