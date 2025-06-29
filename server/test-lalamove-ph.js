require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

async function testLalamovePH() {
  try {
    console.log("=== Lalamove PH Market Test ===");

    const apiKey = process.env.LALAMOVE_API_KEY;
    const secret = process.env.LALAMOVE_API_SECRET;
    const baseUrl = "https://rest.sandbox.lalamove.com";
    const market = "PH";

    console.log(
      "API Key:",
      apiKey ? apiKey.substring(0, 20) + "..." : "Not Set"
    );
    console.log(
      "Secret:",
      secret ? secret.substring(0, 20) + "..." : "Not Set"
    );
    console.log("Market:", market);
    console.log("");

    const time = Date.now().toString();
    const method = "POST";
    const path = "/v2/quotations";
    const body = {
      serviceType: "MOTORCYCLE",
      specialRequests: [],
      language: "en-PH",
      stops: [
        {
          location: {
            lat: "14.5838",
            lng: "121.0565",
          },
          address: "SM Megamall, Mandaluyong, Metro Manila",
          contacts: [
            {
              name: "Sender",
              phone: process.env.LALAMOVE_API_USER,
            },
          ],
        },
        {
          location: {
            lat: "14.5515",
            lng: "121.0244",
          },
          address: "Greenbelt 1, Makati, Metro Manila",
          contacts: [
            {
              name: "Recipient",
              phone: "+63976127147",
            },
          ],
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

    const requestBody = JSON.stringify(body);
    const rawSignature = `${time}\r\n${method}\r\n${path}\r\n${requestBody}\r\n`;

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
    };

    console.log("Testing PH market...");
    console.log("Payload:", JSON.stringify(body, null, 2));

    const response = await axios.post(`${baseUrl}${path}`, body, {
      headers,
      timeout: 10000,
    });

    console.log("✅ Success!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
  }
}

testLalamovePH();
