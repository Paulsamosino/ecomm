require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

async function testSimpleLalamove() {
  try {
    console.log("=== Simple Lalamove API Test ===");

    const apiKey = process.env.LALAMOVE_API_KEY;
    const secret = process.env.LALAMOVE_API_SECRET;
    const baseUrl =
      process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    const market = process.env.LALAMOVE_MARKET || "PH";

    console.log(
      "API Key:",
      apiKey ? apiKey.substring(0, 20) + "..." : "Not Set"
    );
    console.log(
      "Secret:",
      secret ? secret.substring(0, 20) + "..." : "Not Set"
    );
    console.log("Base URL:", baseUrl);
    console.log("Market:", market);
    console.log("");

    // Test a simple GET request to verify credentials
    const time = Date.now().toString();
    const method = "GET";
    const path = "/v3/orders";
    const rawSignature = `${time}${method}${path}`;

    const signature = crypto
      .createHmac("sha256", secret)
      .update(rawSignature)
      .digest("hex");

    const headers = {
      "X-Request-ID": crypto.randomUUID(),
      "Content-Type": "application/json",
      Authorization: `hmac ${apiKey}:${time}:${signature}`,
      Market: market,
      Accept: "application/json",
      "X-LLM-Market": market,
      "X-API-Version": "3.0",
      "X-Sdk-Type": "NODE_JS_SDK",
      "X-Sdk-Version": "1.0.0",
    };

    console.log("Testing GET /v3/orders...");
    console.log("Headers:", {
      "X-Request-ID": headers["X-Request-ID"],
      Authorization: headers["Authorization"].substring(0, 50) + "...",
      Market: headers["Market"],
    });

    const response = await axios.get(`${baseUrl}${path}`, {
      headers,
      timeout: 10000,
    });

    console.log("Success! Response:", response.data);
  } catch (error) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testSimpleLalamove();
