const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const deliveryController = require("../controllers/deliveryController");
const { upload } = require("../config/cloudinary");
const NotificationService = require("../services/notificationService");
const {
  sendOrderConfirmationEmail,
  sendSellerOrderNotification,
  sendOrderStatusUpdate,
} = require("../utils/emailService");
const {
  sendPurchaseNotification,
  sendOrderStatusUpdate: sendOrderStatusSMS
} = require("../utils/smsService");

// Create a new order
router.post("/", protect, async (req, res) => {
  try {
  const { items, paymentInfo, totalAmount, shippingAddress, delivery, voucherCode } = req.body;
  // Calculate grand total from items (sum of item.price * quantity) to avoid using client-side total which may include fees
  const grandItemsTotal = (items || []).reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  let voucherApplied = null;

    // Validate required fields
    if (!items?.length) {
      return res
        .status(400)
        .json({ message: "Order must contain at least one item" });
    }

    if (
      !shippingAddress?.street ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.zipCode ||
      !shippingAddress?.country ||
      !shippingAddress?.phone
    ) {
      return res
        .status(400)
        .json({ message: "Complete shipping address is required" });
    }

    if (!paymentInfo?.transactionId) {
      return res
        .status(400)
        .json({ message: "Payment information is required" });
    }

    // Verify stock availability before creating order
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.product} not found` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`,
        });
      }
    }

    // Group items by seller to create separate orders for each seller
    const itemsBySeller = {};
    
    for (const item of items) {
      const sellerId = item.seller;
      if (!sellerId) {
        return res.status(400).json({ 
          message: "All items must have seller information" 
        });
      }
      
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }
      itemsBySeller[sellerId].push(item);
    }

    console.log(`📦 Creating orders for ${Object.keys(itemsBySeller).length} seller(s)`);

    const createdOrders = [];
    const orderResponses = [];

    // Create separate orders for each seller
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      try {
        console.log(`👤 Processing order for seller: ${sellerId} with ${sellerItems.length} items`);

        // Load seller details for delivery
        const seller = await User.findById(sellerId)
          .populate("address")
          .populate("sellerProfile.location");
        
        if (!seller) {
          console.error(`Seller ${sellerId} not found`);
          return res.status(404).json({ message: `Seller ${sellerId} not found` });
        }

    // Calculate total for this seller's items
    const sellerTotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate proportional platform fee based on items-only grand total (2% of items total)
  const totalPlatformFee = grandItemsTotal * 0.02;
  const sellerPlatformFee = grandItemsTotal > 0 ? (sellerTotal / grandItemsTotal) * totalPlatformFee : 0;

  // Proportion of grand items total for this seller (used for shipping/voucher share)
  const proportion = grandItemsTotal > 0 ? (sellerTotal / grandItemsTotal) : 0;
  // Compute overall shipping fee total (if provided) and seller's share of it
  const shippingFeeTotal = (delivery && delivery.shippingFee) ? Number(delivery.shippingFee || 0) : 0;
  const sellerShippingShare = Math.round((shippingFeeTotal * proportion) * 100) / 100;

        // Build items with snapshot of warranty fields
        const itemsWithWarranty = [];
        for (const item of sellerItems) {
          const prod = await Product.findById(item.product);
          itemsWithWarranty.push({
            product: item.product,
            seller: item.seller,
            quantity: item.quantity,
            price: item.price,
            warrantyPeriod: prod ? prod.warrantyPeriod || "" : "",
            warrantyDetails: prod ? prod.warrantyDetails || "" : "",
          });
        }

  const order = new Order({
          buyer: req.user._id,
          seller: sellerId,
          items: itemsWithWarranty,
          paymentInfo: {
            method: paymentInfo.method || "paypal",
            status: paymentInfo.status || "completed",
            transactionId: paymentInfo.transactionId,
            platformFee: sellerPlatformFee,
          },
          delivery: delivery ? {
            status: "pending",
            price: {
              amount: delivery.shippingFee || 0,
              currency: "PHP"
            }
          } : undefined,
          status: "pending",
          // Initially set to seller items subtotal (may be adjusted below for voucher/shipping/platform fee)
          totalAmount: sellerTotal,
          shippingAddress,
        });

  // If there is a voucher code and this is the first created order loop, validate and apply discount proportionally
  if (!voucherApplied && voucherCode) {
          try {
            const Voucher = require('../models/Voucher');
            const v = await Voucher.findOne({ code: (voucherCode || '').toUpperCase() });
            if (v) {
              // pass buyer id to check if this user already used the voucher
                // Validate against server-computed items-only total (grandItemsTotal)
                const valid = v.isValid(grandItemsTotal, req.user && (req.user._id || req.user.id));
              if (valid.valid) {
                // apply proportionally to this sellerTotal based on share of items-only grand total
                const proportion = grandItemsTotal > 0 ? (sellerTotal / grandItemsTotal) : 0;
                const applied = v.applyTo(grandItemsTotal);
                const sellerDiscount = Math.round((applied.discount * proportion) * 100) / 100;
                console.log(`Voucher apply debug - code=${v.code} grandItemsTotal=${grandItemsTotal} appliedDiscount=${applied.discount} proportion=${proportion} sellerDiscount=${sellerDiscount}`);
                // compute seller's share of shipping (if any)
                const shippingFeeTotal = (delivery && delivery.shippingFee) ? Number(delivery.shippingFee || 0) : 0;
                const sellerShippingShare = Math.round((shippingFeeTotal * proportion) * 100) / 100;
                // final order total for buyer for this seller: seller items - discount + platform fee share + shipping share
                const finalSellerTotal = Math.max(0, Math.round(((order.totalAmount - sellerDiscount + sellerPlatformFee + sellerShippingShare) * 100)) / 100);
                console.log(`Order calc debug - seller=${sellerId} sellerItems=${order.totalAmount} sellerDiscount=${sellerDiscount} sellerPlatformFee=${sellerPlatformFee} sellerShippingShare=${sellerShippingShare} finalSellerTotal=${finalSellerTotal}`);
                order.totalAmount = finalSellerTotal;
                // store the delivery.price.amount as seller shipping share
                if (order.delivery && order.delivery.price) order.delivery.price.amount = sellerShippingShare;
                voucherApplied = v;
                // mark voucher for redemption after orders are saved
              }
            }
          } catch (vcErr) {
            console.error('Voucher validation error:', vcErr);
          }
        }

        // If no voucher was applied, include platform fee and seller shipping share in the saved totalAmount
        if (!voucherApplied) {
          try {
            const computedFinal = Math.max(0, Math.round(((order.totalAmount + sellerPlatformFee + sellerShippingShare) * 100)) / 100);
            order.totalAmount = computedFinal;
            if (order.delivery && order.delivery.price) order.delivery.price.amount = sellerShippingShare;
          } catch (err) {
            console.error('Error computing final seller total (no voucher):', err);
          }
        }

  await order.save();
  console.log(`Saved order ${order._id} totalAmount=${order.totalAmount} seller=${order.seller}`);
        createdOrders.push(order);

        // If payment was by wallet, debit the buyer immediately for this seller order
        try {
          if (paymentInfo?.method === 'wallet') {
            const buyerUser = await User.findById(req.user._id);
            console.debug('Attempting to debit wallet for user:', req.user._id, 'amount:', order.totalAmount);
            if (!buyerUser) throw new Error('Buyer not found when debiting wallet');
            await buyerUser.debitWallet(order.totalAmount, 'purchase', { orderId: order._id, method: 'wallet' });
            console.log(`✅ Debited buyer wallet ₱${order.totalAmount} for order ${order._id}`);
          }
        } catch (debitErr) {
          console.error('Error debiting buyer wallet for order', order._id, debitErr);
          // Rollback: remove saved order and bubble error
          try { await Order.findByIdAndDelete(order._id); } catch(_) { console.error('Rollback delete failed for order', order._id); }
          return res.status(400).json({ message: 'Failed to debit wallet balance', error: debitErr.message });
        }

        // Note: Individual order notifications moved to consolidated section below

        // Update seller's total sales and stats
        if (seller.sellerProfile) {
          seller.sellerProfile.totalSales =
            (seller.sellerProfile.totalSales || 0) + sellerTotal;
          await seller.save();
        }

        orderResponses.push({
          id: order._id,
          seller: seller.name,
          sellerId: seller._id,
          items: sellerItems.length,
          // total should reflect the final charged amount (includes platform fee & shipping share and voucher deduction)
          total: order.totalAmount,
          status: order.status
        });

        console.log(`✅ Order created for seller ${seller.name}: ${order._id}`);

      } catch (sellerOrderError) {
        console.error(`❌ Failed to create order for seller ${sellerId}:`, sellerOrderError);
        return res.status(500).json({
          message: `Failed to create order for seller ${sellerId}`,
          error: sellerOrderError.message
        });
      }
    }

    // Update buyer's order history with all created orders
    const buyer = await User.findById(req.user._id);
    if (buyer) {
      buyer.orderHistory = buyer.orderHistory || [];
      for (const order of createdOrders) {
        buyer.orderHistory.push(order._id);
      }
      await buyer.save();
    }

    // Create platform logs for purchases so admins can see them in Logs
    try {
      const PlatformLog = require('../models/PlatformLog');
      for (const order of createdOrders) {
        await PlatformLog.create({
          actor: req.user._id,
          type: 'purchase',
          amount: order.totalAmount,
          currency: 'PHP',
          relatedOrder: order._id,
          details: { orderId: order._id, seller: order.seller, items: order.items.length },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    } catch (logErr) {
      console.error('Failed to write platform logs for orders:', logErr);
    }

    // Create consolidated notifications for the buyer (prevents duplicates for multi-seller purchases)
    try {
      if (createdOrders.length === 1) {
        // Single seller purchase - create individual notifications
        const order = createdOrders[0];
        
        await NotificationService.createOrderNotification(
          req.user._id,
          order._id,
          'order_created'
        );
        console.log(`✅ Order notification created for buyer: ${order._id}`);

        // Create payment notification for non-cash payments
          if (paymentInfo.method !== 'cash') {
          // order.totalAmount already includes platform fee share and shipping share
          const totalPaidAmount = order.totalAmount;
          
          await NotificationService.createPaymentNotification(
            req.user._id,
            order._id,
            'payment_processed',
            totalPaidAmount
          );
          console.log(`✅ Payment notification created for buyer: ${order._id} - ₱${totalPaidAmount}`);
        }
      } else {
        // Multi-seller purchase - create consolidated notifications
        const totalItems = createdOrders.reduce((sum, order) => sum + order.items.length, 0);
        const sellerNames = createdOrders.map(order => order.seller.toString()).slice(0, 2); // Limit to first 2 sellers
        const sellerCount = createdOrders.length;
        
        // Create consolidated order notification
        const consolidatedOrderMessage = `Your order with ${totalItems} items from ${sellerCount} seller${sellerCount > 1 ? 's' : ''} has been confirmed.`;
        await NotificationService.createSystemNotification(
          req.user._id,
          "Orders Confirmed",
          consolidatedOrderMessage,
          `/buyer-dashboard/orders`,
          'normal'
        );
        console.log(`✅ Consolidated order notification created for buyer: ${sellerCount} orders`);

        // Create consolidated payment notification for non-cash payments
        if (paymentInfo.method !== 'cash') {
          // compute actual paid amount from created orders (they include platform & shipping shares)
          const totalPaidAmount = createdOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

          await NotificationService.createSystemNotification(
            req.user._id,
            "Payment Processed",
            `Payment of ₱${totalPaidAmount.toFixed(2)} processed successfully for your ${sellerCount} order${sellerCount > 1 ? 's' : ''}.`,
            `/buyer-dashboard/orders`,
            'normal'
          );
          console.log(`✅ Consolidated payment notification created for buyer: ₱${totalPaidAmount} for ${sellerCount} orders`);
        }
      }
    } catch (notificationError) {
      console.error(`❌ Failed to create consolidated notifications:`, notificationError);
      // Don't fail the order creation if notification fails
    }

    // Process each order for emails and delivery
    // Redeem voucher (if applied) and apply wallet bonus for wallet payments
    try {
      if (voucherApplied) {
        try {
          // pass buyer id so the voucher records who used it (prevents reuse by same buyer)
          await voucherApplied.redeem(req.user && (req.user._id || req.user.id));
          console.log(`✅ Voucher ${voucherApplied.code} redeemed (usesLeft: ${voucherApplied.usesLeft})`);
        } catch (redeemErr) {
          console.error('Failed to redeem voucher after order creation:', redeemErr);
        }
      }

  // Wallet bonus: if buyer paid with wallet and items-only grand total >= 2000, credit small bonus (e.g., 200)
  if (paymentInfo?.method === 'wallet' && Number(grandItemsTotal || 0) >= 2000) {
        try {
          const Buyer = await User.findById(req.user._id);
          if (Buyer) {
            await Buyer.creditWallet(200, 'bonus', { reason: 'Wallet purchase bonus', threshold: 2000 });
            console.log(`✅ Wallet bonus credited to buyer ${Buyer._id}: ₱200`);
          }
        } catch (bonusErr) {
          console.error('Failed to credit wallet bonus:', bonusErr);
        }
      }
    } catch (outerErr) {
      console.error('Error during post-order voucher/wallet processing:', outerErr);
    }

    // ⚡ PERFORMANCE OPTIMIZATION: Move time-consuming operations to background
    // This allows the API to respond immediately while processing continues asynchronously
    console.log(`⚡ Queueing background processing for ${createdOrders.length} orders...`);
    
    // Process all orders in background (non-blocking)
    setImmediate(async () => {
      console.log(`🔄 Starting background processing for ${createdOrders.length} orders...`);
      
      // Process all orders in parallel for maximum speed
      await Promise.allSettled(
        createdOrders.map(async (order) => {
          try {
            // Populate order with buyer, seller, and product information for emails and delivery
            const populatedOrder = await Order.findById(order._id)
              .populate("buyer", "name phone email")
              .populate({
                path: "seller", 
                select: "name phone email address sellerProfile",
                populate: {
                  path: "sellerProfile.location",
                  select: "street city state zipCode country phone"
                }
              })
              .populate("items.product");

            if (!populatedOrder) {
              console.error(`❌ Order ${order._id} not found during background processing`);
              return;
            }

            console.log(`🔄 Processing order ${order._id} in background (Seller: ${populatedOrder.seller?.name})`);

            // Run email, SMS, and delivery creation in parallel
            const [emailResult, smsResult, deliveryResult] = await Promise.allSettled([
              // Email notifications
              (async () => {
                try {
                  await Promise.all([
                    sendOrderConfirmationEmail(populatedOrder),
                    sendSellerOrderNotification(populatedOrder)
                  ]);
                  console.log(`✅ Emails sent for order ${order._id}`);
                } catch (emailError) {
                  console.error(`❌ Email error for order ${order._id}:`, emailError.message);
                }
              })(),

              // SMS notifications
              (async () => {
                try {
                  const smsPromises = [];
                  
                  const sellerPhone = populatedOrder.seller?.sellerProfile?.location?.phone;
                  if (sellerPhone) {
                    smsPromises.push(sendPurchaseNotification(sellerPhone, populatedOrder));
                  }
                  
                  const buyerPhone = populatedOrder.shippingAddress?.phone;
                  if (buyerPhone) {
                    smsPromises.push(sendOrderStatusSMS(buyerPhone, populatedOrder, 'confirmed'));
                  }
                  
                  if (smsPromises.length > 0) {
                    await Promise.all(smsPromises);
                    console.log(`✅ SMS sent for order ${order._id}`);
                  }
                } catch (smsError) {
                  console.error(`❌ SMS error for order ${order._id}:`, smsError.message);
                }
              })(),

              // Delivery creation
              (async () => {
                try {
                  const deliveryResult = await deliveryController.autoCreateDelivery(populatedOrder);
                  if (deliveryResult) {
                    console.log(`✅ Delivery created for order ${order._id}`);
                  } else {
                    console.warn(`⚠️ Delivery creation returned null for order ${order._id}`);
                  }
                } catch (deliveryError) {
                  console.error(`❌ Delivery error for order ${order._id}:`, deliveryError.message);
                }
              })()
            ]);

            console.log(`✅ Background processing completed for order ${order._id}`);

          } catch (processingError) {
            console.error(`❌ Error in background processing for order ${order._id}:`, processingError);
          }
        })
      );

      console.log(`✅ Background processing finished for all ${createdOrders.length} orders`);
    });

    // Compute canonical grand total from persisted orders.
    // `order.totalAmount` is stored as the final charged amount for that seller (items after discount + platform fee + shipping share),
    // so sum those values directly to get the canonical grand total.
    const canonicalGrandTotal = createdOrders.reduce((sum, o) => {
      return sum + Number(o.totalAmount || 0);
    }, 0);

    res.status(201).json({
      message: `Orders created successfully for ${createdOrders.length} seller(s)`,
      orders: orderResponses,
      totalOrders: createdOrders.length,
      grandTotal: canonicalGrandTotal,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
});

// Get buyer's orders
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("items.product")
      .populate("items.seller", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// Get order details
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product", "name price images");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user has permission to view this order
    if (
      order.buyer._id.toString() !== req.user._id.toString() &&
      order.seller._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details" });
  }
});

// Update order status (seller only)
router.put("/:id/status", protect, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify seller owns this order
    if (order.seller._id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    // Update order details
    // If status is being changed to 'cancelled', use the cancel() method to restore inventory
    if (status === 'cancelled') {
      await order.cancel(notes || 'Cancelled by seller');
    } else {
      order.status = status;
      if (notes) order.notes = notes;

      try {
        await order.save();
      } catch (error) {
        if (error.message.includes("Invalid status transition")) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    }

    // Send status update email to buyer
    try {
      await sendOrderStatusUpdate(order);
    } catch (emailError) {
      console.error("Error sending status update email:", emailError);
      // Don't fail the update if email fails
    }

    // Create status update notification for buyer
    try {
      const notificationTypes = {
        'processing': 'order_confirmed',
        'shipped': 'order_shipped',
        'delivered': 'order_delivered',
        'cancelled': 'order_cancelled'
      };

      const notificationType = notificationTypes[status];
      if (notificationType) {
        await NotificationService.createOrderNotification(
          order.buyer._id,
          order._id,
          notificationType
        );
        console.log(`✅ Status notification created for buyer: ${order._id} - ${status}`);
      }
    } catch (notificationError) {
      console.error("Error creating status notification:", notificationError);
      // Don't fail the update if notification fails
    }

    // Send payment notification for cash orders only when completed
    if (order.paymentInfo.method === 'cash' && status === 'completed') {
      try {
        // order.totalAmount already includes platform fee and shipping share
        const totalPaidAmount = order.totalAmount || 0;

        await NotificationService.createPaymentNotification(
          order.buyer._id,
          order._id,
          'payment_processed',
          totalPaidAmount
        );
        console.log(`✅ Cash payment notification created for buyer: ${order._id} - ₱${totalPaidAmount}`);
      } catch (notificationError) {
        console.error(`❌ Failed to create cash payment notification:`, notificationError);
        // Don't fail the update if notification fails
      }
    }

    // Send SMS status update to buyer
    try {
      const buyerPhone = order.shippingAddress?.phone;
      if (buyerPhone) {
        console.log(`📱 Sending status update SMS to buyer: ${buyerPhone}`);
        const smsResult = await sendOrderStatusSMS(buyerPhone, order, status);
        console.log("📱 Buyer SMS status update result:", smsResult);
      } else {
        console.log("⚠️ Buyer phone number not available - skipping status SMS");
      }
    } catch (smsError) {
      console.error("❌ Error sending status update SMS:", smsError);
      // Don't fail the update if SMS fails
    }

    res.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// Process refund
router.post("/:id/refund", protect, async (req, res) => {
  try {
    const { refundId, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify seller owns this order
    if (order.seller.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to refund this order" });
    }

    await order.refund(refundId);

    // If original payment was from wallet or PayPal, credit the buyer's wallet
    try {
      if (["wallet", "paypal"].includes(order.paymentInfo?.method)) {
        const buyerUser = await User.findById(order.buyer);
        if (buyerUser) {
          // order.totalAmount already includes platform fee and shipping share
          const refundAmount = order.totalAmount || 0;
          await buyerUser.creditWallet(refundAmount, 'refund', { orderId: order._id, reason, refundedVia: order.paymentInfo?.method });
          console.log(`\u2705 Credited buyer wallet \u20b1${refundAmount} for refunded order ${order._id} (via ${order.paymentInfo?.method})`);
        } else {
          console.warn('Buyer not found to credit wallet for refund', order.buyer);
        }
      }
    } catch (walletCreditErr) {
      console.error('Error crediting buyer wallet for refund', walletCreditErr);
      // continue, do not fail refund because wallet credit failed; notify admins separately
    }

    // Create refund notification for buyer
    try {
      await NotificationService.createOrderNotification(
        order.buyer._id,
        order._id,
        'order_refunded'
      );
      console.log(`✅ Refund notification created for buyer: ${order._id}`);
    } catch (notificationError) {
      console.error(`❌ Failed to create refund notification:`, notificationError);
      // Don't fail the refund if notification fails
    }

    // Cancel delivery if exists
    if (order.delivery?.lalamoveOrderId) {
      try {
        await deliveryController.cancelDelivery(order._id);
      } catch (deliveryError) {
        console.error("Error cancelling delivery:", deliveryError);
      }
    }

    // Add refund reason to notes
    order.notes = `Refunded: ${reason}`;
    await order.save();

    res.json({ message: "Refund processed successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error processing refund" });
  }
});

// Buyer cancels an order
router.post("/:id/cancel", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify buyer owns this order
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Only allow cancelling orders that are not delivered/refunded/cancelled
    if (['delivered', 'refunded', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: `Order cannot be cancelled from status ${order.status}` });
    }

    await order.cancel(reason);

      // If original payment was from wallet or PayPal, credit the buyer's wallet on cancel
      try {
        if (["wallet", "paypal"].includes(order.paymentInfo?.method)) {
          const buyerUser = await User.findById(order.buyer);
          if (buyerUser) {
            const refundAmount = order.totalAmount || 0;
            await buyerUser.creditWallet(refundAmount, 'refund', { orderId: order._id, reason: reason || 'cancelled', refundedVia: order.paymentInfo?.method });
            console.log(`\u2705 Credited buyer wallet \u20b1${refundAmount} for cancelled order ${order._id} (via ${order.paymentInfo?.method})`);
          } else {
            console.warn('Buyer not found to credit wallet for cancel', order.buyer);
          }
        }
      } catch (walletCreditErr) {
        console.error('Error crediting buyer wallet for cancel', walletCreditErr);
        // continue
      }
    // Notify seller and buyer
    try {
      await NotificationService.createOrderNotification(
        order.seller,
        order._id,
        'order_cancelled'
      );
      await NotificationService.createOrderNotification(
        order.buyer,
        order._id,
        'order_cancelled'
      );
    } catch (notificationError) {
      console.error('Failed to create cancellation notifications:', notificationError);
    }

    // Cancel delivery if exists
    if (order.delivery?.lalamoveOrderId) {
      try {
        await deliveryController.cancelDelivery(order._id);
      } catch (deliveryError) {
        console.error('Error cancelling delivery:', deliveryError);
      }
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Error cancelling order' });
  }
});

// Buyer requests a refund for a delivered order
// Buyer requests a refund for a delivered order (accepts one evidence image)
router.post('/:id/request-refund', protect, upload.single('evidence'), async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to request refund for this order' });
    }

    // Only allow refund requests on delivered orders
    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Refund can only be requested for delivered orders' });
    }

    order.refundRequested = true;
    order.refundRequestedAt = new Date();
    order.refundReason = reason || '';

    // If an evidence image was uploaded, store its URL and publicId
    if (req.file && req.file.path) {
      order.refundEvidence = order.refundEvidence || [];
      order.refundEvidence.push({ url: req.file.path, publicId: req.file.filename });
    }

    await order.save();

    // Notify seller about refund request
    try {
      await NotificationService.createSystemNotification(
        order.seller,
        'Refund Requested',
        `Buyer has requested a refund for order ${order._id}`,
        `/seller-dashboard/orders/${order._id}`,
        'normal'
      );
    } catch (notificationError) {
      console.error('Failed to notify seller about refund request:', notificationError);
    }

    // Notify all admins so they can review the refund with evidence
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await NotificationService.createSystemNotification(
          admin._id,
          'Refund Requested (Review)',
          `Refund requested for order ${order._id}.`,
          `/admin/orders/${order._id}`,
          'high'
        );
      }
    } catch (adminNotifyErr) {
      console.error('Failed to notify admins about refund request:', adminNotifyErr);
    }

    res.json({ message: 'Refund request submitted', order });
  } catch (error) {
    console.error('Error requesting refund:', error);
    res.status(500).json({ message: 'Error requesting refund' });
  }
});

// Add review to order
router.post("/:id/review", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("seller", "name email")
      .populate("items.product", "name");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify buyer owns this order
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to review this order" });
    }

    // Add review using the new method
    try {
      await order.createReview({ rating, comment });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    // Send review notification to seller
    try {
      const productNames = order.items.map(item => item.product.name).join(", ");
      await NotificationService.createSystemNotification(
        order.seller._id,
        "New Review Received",
        `You received a ${rating}-star review for: ${productNames}`,
        `/seller-dashboard/reviews`,
        'normal'
      );
      console.log(`✅ Review notification sent to seller: ${order.seller._id}`);
    } catch (notificationError) {
      console.error(`❌ Failed to send review notification:`, notificationError);
      // Don't fail the review submission if notification fails
    }

    res.json({ message: "Review submitted successfully" });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Error submitting review" });
  }
});

module.exports = router;
