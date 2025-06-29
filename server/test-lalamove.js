require("dotenv").config();
const lalamoveService = require("./src/services/lalamoveService");

async function testLalamoveAPI() {
  try {
    console.log("=== Lalamove API Test ===");
    console.log("Environment Variables:");
    console.log("API Key:", process.env.LALAMOVE_API_KEY ? "Set" : "Not Set");
    console.log(
      "API Secret:",
      process.env.LALAMOVE_API_SECRET ? "Set" : "Not Set"
    );
    console.log("API User:", process.env.LALAMOVE_API_USER);
    console.log("Base URL:", process.env.LALAMOVE_SANDBOX_URL);
    console.log("Market:", process.env.LALAMOVE_MARKET);
    console.log("");

    // Test quote request
    console.log("Testing Quote Request...");
    const quoteData = {
      serviceType: "MOTORCYCLE",
      language: "en-PH",
      stops: [
        {
          location: {
            lat: "14.5838",
            lng: "121.0565",
          },
          address: "SM Megamall, Mandaluyong, Metro Manila",
          contact: {
            name: "Sender",
            phone: process.env.LALAMOVE_API_USER,
          },
        },
        {
          location: {
            lat: "14.5515",
            lng: "121.0244",
          },
          address: "Greenbelt 1, Makati, Metro Manila",
          contact: {
            name: "Recipient",
            phone: "+63976127147",
          },
        },
      ],
      item: {
        quantity: "1",
        weight: "0.5",
        categories: [],
        handles: {},
        remarks: "Test delivery",
      },
    };

    const quote = await lalamoveService.getQuote(quoteData);
    console.log("Quote Response:", JSON.stringify(quote, null, 2));
  } catch (error) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
      console.error("Response Headers:", error.response.headers);
    }
  }
}

// Run the test
testLalamoveAPI();
