# Lalamove Delivery Integration Documentation

## Overview

The system integrates with Lalamove's delivery API to provide automated delivery services. All delivery processes are fully automated from order creation to delivery completion.

## Features

- Automatic delivery creation on order placement
- Real-time delivery status tracking
- Webhook integration for status updates
- Socket.IO real-time notifications
- Automatic geocoding for delivery addresses
- Delivery cancellation and retry system

## Technical Implementation

### 1. Core Components

- **LalamoveService**: Handles API communication with Lalamove
- **DeliveryController**: Manages delivery operations
- **WebhookController**: Processes Lalamove callbacks
- **GeocodeService**: Handles address coordinate conversion

### 2. Automated Flow

1. Order Creation

   ```javascript
   // Automatic delivery creation on order placement
   const populatedOrder = await Order.findById(order._id)
     .populate("buyer", "name phone email")
     .populate("seller", "name phone email address");
   await deliveryController.autoCreateDelivery(populatedOrder);
   ```

2. Address Processing

   ```javascript
   // Automatic coordinate generation
   const coordinates = await geocodeAddress(address);
   address.coordinates = {
     lat: coordinates.lat,
     lng: coordinates.lng,
   };
   ```

3. Status Updates
   ```javascript
   // Webhook handling for status updates
   router.post(
     "/webhook/lalamove/delivery",
     verifyLalamoveWebhook,
     webhookController.handleDeliveryUpdate
   );
   ```

### 3. Real-time Updates

The system emits Socket.IO events for:

- Delivery status changes (`deliveryUpdate`)
- Driver assignment (`driverAssigned`)
- Location updates (`locationUpdate`)
- Delivery completion (`deliveryComplete`)
- Cancellations (`deliveryCancelled`)

### 4. Error Handling & Retries

- Automatic retry on delivery creation failure
- Fallback coordinates for geocoding failures
- Webhook signature verification
- Rate limiting protection (50 QPM)

## Configuration

### Environment Variables

```env
# Lalamove API Configuration
LALAMOVE_API_KEY=your_api_key
LALAMOVE_API_SECRET=your_api_secret
LALAMOVE_API_USER=your_api_user
LALAMOVE_SANDBOX_URL=https://rest.sandbox.lalamove.com

# Google Maps API (for geocoding)
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Webhook URLs

Configure these URLs in your Lalamove dashboard:

```
Delivery Status: https://your-domain.com/webhook/lalamove/delivery
Driver Assignment: https://your-domain.com/webhook/lalamove/driver
Cancellation: https://your-domain.com/webhook/lalamove/cancellation
```

## Integration Flow

1. **Order Placement**

   - Order is created
   - Address coordinates are automatically generated
   - Lalamove delivery is automatically created

2. **Delivery Processing**

   - Lalamove assigns a driver
   - Driver details are stored and broadcasted
   - Real-time location updates are received and broadcasted

3. **Completion/Cancellation**
   - Delivery completion updates order status
   - Cancellations trigger automatic retry
   - All events are broadcasted to relevant clients

## Monitoring & Debugging

### Socket Events

```javascript
// Listen for delivery updates
socket.on("deliveryUpdate", (data) => {
  const { orderId, status, driver, location } = data;
  // Update UI with new status
});

// Listen for driver assignment
socket.on("driverAssigned", (data) => {
  const { orderId, driver } = data;
  // Show driver information
});
```

### Webhook Verification

```javascript
// Verify webhook signatures
const signature = req.headers["x-lalamove-signature"];
const isValid = verifyLalamoveSignature(signature, requestBody);
```

## Error Recovery

The system includes several error recovery mechanisms:

1. **Delivery Creation Failures**

   - Automatic retry after 1 minute
   - Maximum 3 retry attempts
   - Manual trigger option in admin panel

2. **Geocoding Failures**

   - Falls back to default coordinates
   - Logs failure for manual review
   - Can be manually updated later

3. **Webhook Failures**
   - Failed webhooks are logged
   - Status can be manually synced
   - Automatic retry for critical updates

## Rate Limiting

- 50 requests per minute to Lalamove API
- Automatic queue system for high volume periods
- Error handling for rate limit exceeded

## Testing

To test the integration:

1. Use sandbox credentials
2. Create a test order
3. Monitor webhooks using provided test endpoints
4. Check real-time updates in the UI
5. Verify database updates

## Support

For issues or questions:

1. Check the error logs in `/var/log/delivery.log`
2. Contact Lalamove support with your API key
3. Review the webhook logs in the admin panel
