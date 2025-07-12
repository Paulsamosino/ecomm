require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const stringify = require('json-stable-stringify');

async function testLalamoveOrder() {
  try {
    console.log("=== Lalamove Full Order Test ===");

    const apiKey = process.env.LALAMOVE_API_KEY;
    const secret = process.env.LALAMOVE_API_SECRET;
    const baseUrl = process.env.LALAMOVE_SANDBOX_URL || "https://rest.sandbox.lalamove.com";
    const market = process.env.LALAMOVE_MARKET || "PH";

    console.log("API Key:", apiKey ? apiKey.substring(0, 20) + "..." : "Not Set");
    console.log("Base URL:", baseUrl);
    console.log("Market:", market);
    console.log("");

    // Step 1: Get a quotation first
    console.log("📋 Step 1: Getting quotation...");
    const quoteTime = Date.now().toString();
    const quotePath = "/v3/quotations";
    
    const quoteRequestBody = {
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

    const quoteBodyString = stringify(quoteRequestBody);
    const quoteSignature = crypto
      .createHmac("sha256", secret)
      .update(`${quoteTime}\r\nPOST\r\n${quotePath}\r\n\r\n${quoteBodyString}`)
      .digest("hex");

    const quoteHeaders = {
      "Authorization": `hmac ${apiKey}:${quoteTime}:${quoteSignature}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Market": market,
      "X-API-Version": "3.0",
      "Request-ID": `req-${quoteTime}`
    };

    const quoteResponse = await axios.post(`${baseUrl}${quotePath}`, quoteBodyString, {
      headers: quoteHeaders,
      timeout: 15000,
    });

    console.log("✅ Quote successful!");
    console.log("Quote ID:", quoteResponse.data.data.quotationId);
    console.log("Price:", quoteResponse.data.data.priceBreakdown.total, "PHP");
    console.log("");

    // Step 2: Create order using the quotation
    console.log("🚚 Step 2: Creating order...");
    const orderTime = Date.now().toString();
    const orderPath = "/v3/orders";
    
    const orderRequestBody = {
      data: {
        quotationId: quoteResponse.data.data.quotationId,
        sender: {
          stopId: quoteResponse.data.data.stops[0].stopId,
          name: "Test Seller",
          phone: "+639171234567"
        },
        recipients: [
          {
            stopId: quoteResponse.data.data.stops[1].stopId,
            name: "Test Buyer",
            phone: "+639761271147",
            remarks: "Test order for debugging"
          }
        ],
        metadata: {
          orderId: "TEST-ORDER-" + Date.now(),
          reference: "REF-TEST-" + Date.now(),
          totalItems: "1",
          itemCategories: "FOOD"
        }
      }
    };

    const orderBodyString = stringify(orderRequestBody);
    const orderSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderTime}\r\nPOST\r\n${orderPath}\r\n\r\n${orderBodyString}`)
      .digest("hex");

    const orderHeaders = {
      "Authorization": `hmac ${apiKey}:${orderTime}:${orderSignature}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Market": market,
      "X-API-Version": "3.0",
      "Request-ID": `req-${orderTime}`
    };

    console.log("Order Request Body:", JSON.stringify(orderRequestBody, null, 2));
    console.log("");

    const orderResponse = await axios.post(`${baseUrl}${orderPath}`, orderBodyString, {
      headers: orderHeaders,
      timeout: 15000,
      validateStatus: () => true // Don't throw on 4xx/5xx
    });

    console.log("Order Response Status:", orderResponse.status);
    console.log("Order Response Data:", JSON.stringify(orderResponse.data, null, 2));

    if (orderResponse.status === 201 || orderResponse.status === 200) {
      console.log("✅ Order created successfully!");
      const orderData = orderResponse.data.data;
      if (orderData) {
        console.log("Order ID:", orderData.id || orderData.orderId);
        console.log("Status:", orderData.status);
      }
    } else {
      console.log("❌ Order creation failed");
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLalamoveOrder();
