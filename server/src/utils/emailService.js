const nodemailer = require("nodemailer");

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send order confirmation to buyer
const sendOrderConfirmationEmail = async (order) => {
  try {
    const buyerEmail = order.buyer.email;
    const items = order.items
      .map(
        (item) =>
          `${item.quantity}x ${item.product.name} - ₱${item.price.toFixed(2)}`
      )
      .join("\n");

    await transporter.sendMail({
      from: `"C&P Marketplace" <${process.env.SMTP_FROM}>`,
      to: buyerEmail,
      subject: `Order Confirmation #${order._id}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Your order has been confirmed and is being processed.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Date:</strong> ${new Date(
          order.createdAt
        ).toLocaleString()}</p>
        
        <h3>Items:</h3>
        <pre>${items}</pre>
        
        <p><strong>Subtotal:</strong> ₱${order.totalAmount.toFixed(2)}</p>
        <p><strong>Platform Fee:</strong> ₱${order.paymentInfo.platformFee.toFixed(
          2
        )}</p>
        <p><strong>Total:</strong> ₱${(
          order.totalAmount + order.paymentInfo.platformFee
        ).toFixed(2)}</p>
        
        <h3>Shipping Address:</h3>
        <p>${order.shippingAddress.street}</p>
        <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${
        order.shippingAddress.zipCode
      }</p>
        <p>${order.shippingAddress.country}</p>
        
        <p>We'll notify you when your order ships.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending buyer confirmation email:", error);
  }
};

// Notify seller about new order
const sendSellerOrderNotification = async (order) => {
  try {
    const sellerEmail = order.seller.email;
    const items = order.items
      .map(
        (item) =>
          `${item.quantity}x ${item.product.name} - ₱${item.price.toFixed(2)}`
      )
      .join("\n");

    await transporter.sendMail({
      from: `"C&P Marketplace" <${process.env.SMTP_FROM}>`,
      to: sellerEmail,
      subject: `New Order #${order._id}`,
      html: `
        <h1>New Order Received!</h1>
        <p>You have received a new order.</p>
        
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Date:</strong> ${new Date(
          order.createdAt
        ).toLocaleString()}</p>
        
        <h3>Customer:</h3>
        <p>${order.buyer.name}</p>
        <p>${order.shippingAddress.street}</p>
        <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${
        order.shippingAddress.zipCode
      }</p>
        <p>${order.shippingAddress.country}</p>
        
        <h3>Items:</h3>
        <pre>${items}</pre>
        
        <p><strong>Total:</strong> ₱${order.totalAmount.toFixed(2)}</p>
        <p><strong>Your Revenue:</strong> ₱${(
          order.totalAmount - order.paymentInfo.platformFee
        ).toFixed(2)}</p>
        
        <p>Please process this order as soon as possible.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending seller notification email:", error);
  }
};

const getStatusUpdateTemplate = (order, { trackingNumber } = {}) => {
  const templates = {
    processing: {
      subject: "Your order is being processed",
      body: `
        Dear ${order.buyer.name},
        
        Your order #${order._id.slice(
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
        
        Great news! Your order #${order._id.slice(-6)} has been shipped.
        
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
        
        Your order #${order._id.slice(-6)} has been marked as delivered.
        
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

    await sendEmail({
      to: order.buyer.email,
      subject: template.subject,
      text: template.body,
    });

    console.log(`Status update email sent for order ${order._id}`);
  } catch (error) {
    console.error("Error sending status update email:", error);
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
