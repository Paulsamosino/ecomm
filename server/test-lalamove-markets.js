require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

async function testLalamoveMarkets() {
  try {
    console.log("=== Lalamove Market Test ===");

    const apiKey = process.env.LALAMOVE_API_KEY;
    const secret = process.env.LALAMOVE_API_SECRET;
    const baseUrl = "https://rest.sandbox.lalamove.com";

    // Test different market codes
    const markets = ["PH", "HK", "SG", "TH", "MY", "TW", "ID"];

    for (const market of markets) {
      try {
        console.log(`\nTesting market: ${market}`);

        const time = Date.now().toString();
        const method = "POST";
        const path = "/v2/quotations";
        const body = {
          serviceType: "MOTORCYCLE",
          specialRequests: [],
          language: "en-US",
          stops: [
            {
              location: {
                lat: "14.5838",
                lng: "121.0565",
              },
              address: "Test Address 1",
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
              address: "Test Address 2",
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

        const response = await axios.post(`${baseUrl}${path}`, body, {
          headers,
          timeout: 10000,
        });

        console.log(`✅ Market ${market} works!`);
        console.log("Response:", JSON.stringify(response.data, null, 2));
        return market; // Found working market
      } catch (error) {
        if (
          error.response?.status === 409 &&
          error.response?.data?.message === "ERR_INVALID_MARKET"
        ) {
          console.log(`❌ Market ${market} is invalid`);
        } else {
          console.log(
            `⚠️ Market ${market} error:`,
            error.response?.status,
            error.response?.data?.message
          );
        }
      }
    }

    console.log("\n❌ No working market found");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testLalamoveMarkets();
