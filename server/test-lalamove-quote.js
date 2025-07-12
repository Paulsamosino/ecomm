require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const stringify = require('json-stable-stringify');

async function testLalamoveQuote() {
  try {
    console.log("=== Lalamove Quote API Test ===");

    const apiKey = process.env.LALAMOVE_API_KEY;
    const secret = process.env.LALAMOVE_API_SECRET;
    const baseUrl = process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    const market = process.env.LALAMOVE_MARKET || "PH";

    console.log("API Key:", apiKey ? apiKey.substring(0, 20) + "..." : "Not Set");
    console.log("Secret:", secret ? secret.substring(0, 20) + "..." : "Not Set");
    console.log("Base URL:", baseUrl);
    console.log("Market:", market);
    console.log("");

    // Test quotation endpoint
    const time = Date.now().toString();
    const method = "POST";
    const path = "/v3/quotations";
    
    const requestBody = {
      data: {
        serviceType: "MOTORCYCLE",
        language: "en_PH",
        stops: [
          {
            coordinates: {
              lat: "14.5838",
              lng: "121.0565"
            },
            address: "SM Megamall, Mandaluyong, Metro Manila"
          },
          {
            coordinates: {
              lat: "14.5515",
              lng: "121.0244"
            },
            address: "Greenbelt 1, Makati, Metro Manila"
          }
        ]
      }
    };

    const bodyString = stringify(requestBody);
    const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${bodyString}`;

    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawSignature)
      .digest("hex");

    const headers = {
      "Authorization": `hmac ${apiKey}:${time}:${signature}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Market": market,
      "X-API-Version": "3.0",
      "Request-ID": `req-${time}`
    };

    console.log("Testing POST /v3/quotations...");
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    console.log("");

    const response = await axios.post(`${baseUrl}${path}`, bodyString, {
      headers,
      timeout: 15000,
    });

    console.log("✅ SUCCESS! Quote Response:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data, null, 2));

    if (response.data.data) {
      const quote = response.data.data;
      console.log("\n📋 Quote Summary:");
      console.log("Quote ID:", quote.quotationId);
      console.log("Service Type:", quote.serviceType);
      console.log("Total Price:", quote.priceBreakdown?.total, quote.priceBreakdown?.currency);
      console.log("Distance:", quote.distance?.value, quote.distance?.unit);
      console.log("Expires At:", quote.expiresAt);
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLalamoveQuote();
