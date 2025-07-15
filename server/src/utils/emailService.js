const nodemailer = require("nodemailer");

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test email configuration on startup
const testEmailConfig = async () => {
  try {
    console.log("🔧 Testing email configuration...");
    await transporter.verify();
    console.log("✅ Email service is ready");
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
  }
};

// Call test function
testEmailConfig();

// Send order confirmation to buyer
const sendOrderConfirmationEmail = async (order) => {
  console.log("🚀 sendOrderConfirmationEmail called with order:", {
    orderId: order._id,
    buyerEmail: order.buyer?.email,
    buyerName: order.buyer?.name,
    itemCount: order.items?.length,
    totalAmount: order.totalAmount
  });

  try {
    const buyerEmail = order.buyer.email;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate items HTML with better formatting
    const itemsHTML = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                ${item.product.name}
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                Quantity: ${item.quantity}
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #374151;">
              ₱${(item.price * item.quantity).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");

    await transporter.sendMail({
      from: `"🐔 C&P Poultry Marketplace" <${process.env.SMTP_FROM}>`,
      to: buyerEmail,
      subject: `🎉 Order Confirmation #${order._id.toString().slice(-6)} - Thank you for your purchase!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 40px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 32px; margin-right: 10px;">🐔</span>
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                  C&P Poultry Marketplace
                </h1>
              </div>
              <h2 style="margin: 0; color: white; font-size: 20px; font-weight: 500; opacity: 0.95;">
                Thank you for your order, ${order.buyer.name}!
              </h2>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              
              <!-- Success Message -->
              <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 18px; color: #0369a1; font-weight: 600; margin-bottom: 8px;">
                  🎉 Order Confirmed!
                </div>
                <div style="color: #0369a1; font-size: 14px;">
                  Your order has been confirmed and is being processed. We'll notify you when it ships.
                </div>
              </div>

              <!-- Order Details Card -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    📦 Order Details
                  </h3>
                </div>
                <div style="padding: 20px;">
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #6b7280; font-size: 14px;">Order ID:</span>
                      <span style="color: #374151; font-weight: 600; font-family: monospace;">#${order._id.toString().slice(-6)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #6b7280; font-size: 14px;">Order Date:</span>
                      <span style="color: #374151; font-weight: 500;">${orderDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Items -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    🛒 Items Ordered
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHTML}
                </table>
              </div>

              <!-- Order Summary -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    💰 Order Summary
                  </h3>
                </div>
                <div style="padding: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Subtotal:</span>
                    <span style="color: #374151; font-weight: 500;">₱${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Platform Fee:</span>
                    <span style="color: #374151; font-weight: 500;">₱${order.paymentInfo.platformFee.toFixed(2)}</span>
                  </div>
                  ${order.delivery?.price?.amount ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Shipping Fee:</span>
                    <span style="color: #374151; font-weight: 500;">₱${order.delivery.price.amount.toFixed(2)}</span>
                  </div>
                  ` : ''}
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #374151; font-weight: 600; font-size: 16px;">Total:</span>
                      <span style="color: #f97316; font-weight: 700; font-size: 18px;">
                        ₱${(order.totalAmount + order.paymentInfo.platformFee + (order.delivery?.price?.amount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Shipping Address -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    🚚 Shipping Address
                  </h3>
                </div>
                <div style="padding: 20px; color: #374151; line-height: 1.6;">
                  <div style="font-weight: 600; margin-bottom: 8px;">${order.buyer.name}</div>
                  <div style="margin-bottom: 4px;">${order.shippingAddress.street}</div>
                  <div style="margin-bottom: 4px;">
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </div>
                  <div>${order.shippingAddress.country}</div>
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                  📋 What's Next?
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
                  <li>We'll prepare your order for shipment</li>
                  <li>You'll receive a shipping confirmation with tracking info</li>
                  <li>Expect delivery within 3-5 business days</li>
                  <li>Rate your experience after receiving your order</li>
                </ul>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #374151; padding: 30px 40px; text-align: center;">
              <div style="color: #d1d5db; font-size: 14px; margin-bottom: 16px;">
                Need help? Contact us anytime!
              </div>
              <div style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
                © 2025 C&P Poultry Marketplace. All rights reserved.<br>
                This email was sent because you placed an order on our platform.
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Order confirmation email sent to ${buyerEmail} for order #${order._id.toString().slice(-6)}`);
  } catch (error) {
    console.error("❌ Error sending buyer confirmation email:", error);
    console.error("Order details:", {
      orderId: order._id,
      buyerEmail: order.buyer?.email,
      buyerName: order.buyer?.name
    });
    // Don't throw error to prevent order creation from failing
  }
};

// Notify seller about new order
const sendSellerOrderNotification = async (order) => {
  console.log("🚀 sendSellerOrderNotification called with order:", {
    orderId: order._id,
    sellerEmail: order.seller?.email,
    sellerName: order.seller?.name,
    itemCount: order.items?.length,
    totalAmount: order.totalAmount
  });

  try {
    const sellerEmail = order.seller.email;
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate items HTML with better formatting
    const itemsHTML = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">
                ${item.product.name}
              </div>
              <div style="color: #6b7280; font-size: 14px;">
                Quantity: ${item.quantity}
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #374151;">
              ₱${(item.price * item.quantity).toFixed(2)}
            </td>
          </tr>
        `
      )
      .join("");

    const yourRevenue = order.totalAmount - order.paymentInfo.platformFee;

    await transporter.sendMail({
      from: `"🐔 C&P Poultry Marketplace" <${process.env.SMTP_FROM}>`,
      to: sellerEmail,
      subject: `🔔 New Order #${order._id.toString().slice(-6)} - Action Required!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Order Notification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 32px; margin-right: 10px;">🐔</span>
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                  C&P Poultry Marketplace
                </h1>
              </div>
              <h2 style="margin: 0; color: white; font-size: 20px; font-weight: 500; opacity: 0.95;">
                You have a new order, ${order.seller.name}!
              </h2>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              
              <!-- Alert Message -->
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 18px; color: #047857; font-weight: 600; margin-bottom: 8px;">
                  🔔 New Order Alert!
                </div>
                <div style="color: #047857; font-size: 14px;">
                  A customer has placed an order. Please process it as soon as possible.
                </div>
              </div>

              <!-- Order Details Card -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    📦 Order Information
                  </h3>
                </div>
                <div style="padding: 20px;">
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="color: #6b7280; font-size: 14px;">Order ID:</span>
                      <span style="color: #374151; font-weight: 600; font-family: monospace;">#${order._id.toString().slice(-6)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #6b7280; font-size: 14px;">Order Date:</span>
                      <span style="color: #374151; font-weight: 500;">${orderDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Customer Info -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    👤 Customer Details
                  </h3>
                </div>
                <div style="padding: 20px; color: #374151; line-height: 1.6;">
                  <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${order.buyer.name}</div>
                  <div style="margin-bottom: 4px; color: #6b7280;">📧 ${order.buyer.email}</div>
                  <div style="margin-bottom: 4px; color: #6b7280;">📞 ${order.shippingAddress.phone}</div>
                  <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;">
                  <div style="font-weight: 600; margin-bottom: 8px; color: #6b7280; font-size: 14px;">SHIPPING ADDRESS:</div>
                  <div style="margin-bottom: 4px;">${order.shippingAddress.street}</div>
                  <div style="margin-bottom: 4px;">
                    ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                  </div>
                  <div>${order.shippingAddress.country}</div>
                </div>
              </div>

              <!-- Items -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    🛒 Items to Process
                  </h3>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                  ${itemsHTML}
                </table>
              </div>

              <!-- Revenue Summary -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    💰 Revenue Breakdown
                  </h3>
                </div>
                <div style="padding: 20px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Order Total:</span>
                    <span style="color: #374151; font-weight: 500;">₱${order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #6b7280;">Platform Fee (2%):</span>
                    <span style="color: #dc2626; font-weight: 500;">- ₱${order.paymentInfo.platformFee.toFixed(2)}</span>
                  </div>
                  <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="color: #374151; font-weight: 600; font-size: 16px;">Your Revenue:</span>
                      <span style="color: #10b981; font-weight: 700; font-size: 18px;">
                        ₱${yourRevenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Items -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                  ⚡ Action Required
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
                  <li>Log into your seller dashboard to confirm the order</li>
                  <li>Prepare the items for shipment</li>
                  <li>Update order status to "Processing" when ready</li>
                  <li>Mark as "Shipped" once dispatched</li>
                </ul>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #374151; padding: 30px 40px; text-align: center;">
              <div style="color: #d1d5db; font-size: 14px; margin-bottom: 16px;">
                Process orders quickly to maintain high customer satisfaction!
              </div>
              <div style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
                © 2025 C&P Poultry Marketplace. All rights reserved.<br>
                This notification was sent because you received a new order.
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Seller notification email sent to ${sellerEmail} for order #${order._id.toString().slice(-6)}`);
  } catch (error) {
    console.error("❌ Error sending seller notification email:", error);
    console.error("Order details:", {
      orderId: order._id,
      sellerEmail: order.seller?.email,
      sellerName: order.seller?.name
    });
    // Don't throw error to prevent order creation from failing
  }
};

const getStatusUpdateTemplate = (order, { trackingNumber } = {}) => {
  const templates = {
    processing: {
      subject: "Your order is being processed",
      body: `
        Dear ${order.buyer.name},
        
        Your order #${order._id.toString().slice(
          -6
        )} is now being processed. We'll notify you once it's ready for shipping.
        
        Order Details:
        ${formatOrderItems(order.items)}
        
        Total Amount: $${order.totalAmount.toFixed(2)}
        
        You can track your order status in your account dashboard.
      `,
    },
    shipped: {
      subject: "Your order has been shipped",
      body: `
        Dear ${order.buyer.name},
        
        Great news! Your order #${order._id.toString().slice(-6)} has been shipped.
        
        Tracking Number: ${trackingNumber}
        
        Order Details:
        ${formatOrderItems(order.items)}
        
        Total Amount: $${order.totalAmount.toFixed(2)}
        
        You can track your package using the tracking number above.
      `,
    },
    delivered: {
      subject: "Your order has been delivered",
      body: `
        Dear ${order.buyer.name},
        
        Your order #${order._id.toString().slice(-6)} has been marked as delivered.
        
        We hope you're satisfied with your purchase. Once you've checked your items,
        please take a moment to leave a review. Your feedback helps other buyers make 
        informed decisions.
        
        Order Details:
        ${formatOrderItems(order.items)}
        
        Total Amount: $${order.totalAmount.toFixed(2)}
      `,
    },
    completed: {
      subject: "Order completed - Share your feedback",
      body: `
        Dear ${order.buyer.name},
        
        Your order #${order._id.slice(
          -6
        )} is now complete. We hope you're enjoying your purchase!
        
        Please take a moment to rate your experience and leave a review. Your feedback 
        helps us improve and assists other buyers in making informed decisions.
        
        Order Details:
        ${formatOrderItems(order.items)}
        
        Click here to leave a review: [Review Link]
      `,
    },
  };

  return (
    templates[order.status] || {
      subject: `Order #${order._id.slice(-6)} Status Update`,
      body: `Your order status has been updated to: ${order.status}`,
    }
  );
};

const sendOrderStatusUpdate = async (order, options = {}) => {
  try {
    const template = getStatusUpdateTemplate(order, options);
    const buyerEmail = order.buyer.email;

    await transporter.sendMail({
      from: `"🐔 C&P Poultry Marketplace" <${process.env.SMTP_FROM}>`,
      to: buyerEmail,
      subject: template.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 32px; margin-right: 10px;">🐔</span>
                <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                  C&P Poultry Marketplace
                </h1>
              </div>
              <h2 style="margin: 0; color: white; font-size: 20px; font-weight: 500; opacity: 0.95;">
                Order Status Update
              </h2>
            </div>

            <!-- Content -->
            <div style="padding: 40px;">
              
              <!-- Status Update Message -->
              <div style="background-color: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 18px; color: #1d4ed8; font-weight: 600; margin-bottom: 8px;">
                  📋 Your Order Status Has Been Updated
                </div>
                <div style="color: #1d4ed8; font-size: 16px; font-weight: 600; text-transform: uppercase;">
                  Status: ${order.status}
                </div>
              </div>

              <!-- Order Details -->
              <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <div style="background-color: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                  <h3 style="margin: 0; color: #374151; font-size: 18px; font-weight: 600;">
                    📦 Order #${order._id.slice(-6)}
                  </h3>
                </div>
                <div style="padding: 20px;">
                  <div style="white-space: pre-line; color: #374151; line-height: 1.6;">
                    ${template.body.replace(/Dear.*?,/, '').replace(/Order Details:[\s\S]*/, '')}
                  </div>
                  ${options.trackingNumber ? `
                  <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin-top: 20px;">
                    <div style="color: #0369a1; font-weight: 600; margin-bottom: 5px;">📍 Tracking Number:</div>
                    <div style="color: #0369a1; font-family: monospace; font-size: 16px; font-weight: 600;">
                      ${options.trackingNumber}
                    </div>
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; color: #6b7280; font-size: 14px;">
                <p>You can track your order status in your account dashboard.</p>
                <p>Thank you for choosing C&P Poultry Marketplace!</p>
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #374151; padding: 30px 40px; text-align: center;">
              <div style="color: #d1d5db; font-size: 14px; margin-bottom: 16px;">
                Need help? Contact us anytime!
              </div>
              <div style="color: #9ca3af; font-size: 12px; line-height: 1.5;">
                © 2025 C&P Poultry Marketplace. All rights reserved.<br>
                This email was sent because your order status was updated.
              </div>
            </div>

          </div>
        </body>
        </html>
      `,
      text: template.body,
    });

    console.log(`✅ Status update email sent to ${buyerEmail} for order #${order._id.slice(-6)} - Status: ${order.status}`);
  } catch (error) {
    console.error("❌ Error sending status update email:", error);
    console.error("Order details:", {
      orderId: order._id,
      buyerEmail: order.buyer?.email,
      status: order.status
    });
    throw error;
  }
};

const formatOrderItems = (items) => {
  return items
    .map(
      (item) =>
        `${item.product.name} x ${item.quantity} - $${(
          item.price * item.quantity
        ).toFixed(2)}`
    )
    .join("\n");
};

module.exports = {
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
  sendOrderStatusUpdate,
};
