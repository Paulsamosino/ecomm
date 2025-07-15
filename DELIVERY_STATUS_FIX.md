# Delivery Status Sync Fix & Multi-Seller Support

## Problems Fixed

### 1. Delivery Status Sync Issue
Orders showing as "Pending" in your system even though Lalamove shows them as "Completed".

### 2. Multi-Seller Order Issue  
**MAJOR FIX**: System was only creating deliveries for the first seller when multiple sellers were in a cart. Now creates **separate orders and deliveries for each seller**.

## Solutions

### 1. Manual Status Sync (Immediate Fix)
```bash
# Sync a specific order
GET /api/delivery/:orderId/status/sync

# Sync all pending deliveries
POST /api/delivery/sync-all
```

### 2. Multi-Seller Order Processing
The system now properly:
- **Creates separate orders for each seller** in a multi-seller cart
- **Creates individual Lalamove deliveries** for each seller's order
- **Sends separate email notifications** to each seller
- **Tracks delivery status independently** for each seller

### 3. Automatic Webhook (Long-term Solution)
```bash
# Webhook endpoint for Lalamove
POST /api/delivery/webhook
```

### 4. Enhanced Status Polling
The existing status endpoint now automatically updates order status when delivery is completed.

### 5. Sync Script
```bash
# Run from server directory
npm run sync-deliveries

# Or directly
node scripts/syncDeliveryStatus.js
```

## Multi-Seller Cart Example

**Before (Broken):**
- Cart: [Seller A: Product 1, Seller B: Product 2, Seller C: Product 3]
- Result: Only 1 order created for Seller A, others ignored ❌

**After (Fixed):**
- Cart: [Seller A: Product 1, Seller B: Product 2, Seller C: Product 3]
- Result: 3 separate orders created ✅
  - Order 1: Seller A → Product 1 → Lalamove Delivery 1
  - Order 2: Seller B → Product 2 → Lalamove Delivery 2  
  - Order 3: Seller C → Product 3 → Lalamove Delivery 3

## API Response Changes

### New Order Creation Response:
```json
{
  "message": "Orders created successfully for 3 seller(s)",
  "orders": [
    {
      "id": "order_id_1",
      "seller": "Seller A",
      "sellerId": "seller_a_id",
      "items": 1,
      "total": 150,
      "status": "pending"
    },
    {
      "id": "order_id_2", 
      "seller": "Seller B",
      "sellerId": "seller_b_id",
      "items": 2,
      "total": 300,
      "status": "pending"
    }
  ],
  "totalOrders": 2,
  "grandTotal": 450
}
```

## Quick Fix for Current Issue

### Option 1: Use the API
```bash
# Replace order_id with your actual order ID
curl -X GET "http://localhost:5000/api/delivery/order_id/status/sync" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Option 2: Sync All Orders
```bash
curl -X POST "http://localhost:5000/api/delivery/sync-all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Option 3: Run the Script
```bash
cd server
npm run sync-deliveries
```

### Option 4: Create Missing Deliveries
```bash
# For orders without deliveries
curl -X POST "http://localhost:5000/api/delivery/orders/ORDER_ID/create" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Setup Webhooks (Recommended)

1. **Configure Lalamove Webhook URL** in your Lalamove dashboard:
   ```
   https://yourdomain.com/api/delivery/webhook
   ```

2. **Add environment variable** (optional, for webhook signature validation):
   ```env
   LALAMOVE_WEBHOOK_SECRET=your_webhook_secret
   ```

## Status Mapping

The system now properly maps Lalamove statuses:
- `ASSIGNING_DRIVER` → `assigning_driver`
- `ON_GOING` → `ongoing`
- `PICKED_UP` → `picked_up`
- `COMPLETED` → `completed` (automatically sets order status to "delivered")
- `CANCELLED` → `cancelled`
- `EXPIRED` → `expired`

## New Endpoints

### Configuration Check
```bash
GET /api/delivery/config
```

### Manual Delivery Creation
```bash
POST /api/delivery/orders/:orderId/create
```

## Monitoring

Check the server logs for status updates:
```bash
# Look for these log messages
📦 Creating orders for 3 seller(s)
✅ Order created for seller John's Farm: 60f7b3b4c9d4a2001f4e5678
🚚 Delivery created successfully for order 60f7b3b4c9d4a2001f4e5678: LM123456
Order 60f7b3b4c9d4a2001f4e5678 delivery status changed: pending → completed
Order 60f7b3b4c9d4a2001f4e5678 marked as delivered - Lalamove delivery completed
```

## Testing

1. **Test multi-seller cart**: Add products from different sellers to cart
2. **Test manual sync**: Visit `/api/delivery/:orderId/status/sync`
3. **Test webhook**: Send a POST to `/api/delivery/webhook` with mock data
4. **Check logs**: Monitor console for status change messages

The system now properly handles multi-seller orders and keeps delivery statuses in sync with Lalamove!
