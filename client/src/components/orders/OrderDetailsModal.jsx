import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Truck } from "lucide-react";
import DeliveryTracking from "../delivery/DeliveryTracking";
import CreateDelivery from "../delivery/CreateDelivery";

const OrderDetailsModal = ({ isOpen, onClose, order }) => {
  const [isDeliverySetup, setIsDeliverySetup] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isSeller = user?._id === order?.seller?._id;

  const statusColors = {
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    shipped: "bg-purple-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
    completed: "bg-green-500",
    refunded: "bg-gray-500",
  };

  const handleStatusUpdate = (status) => {
    // Update local order status if needed
    toast({
      title: "Delivery Status Updated",
      description: `Order delivery status is now ${status}`,
    });
  };

  const handleDeliveryCreated = (deliveryOrder) => {
    setIsDeliverySetup(true);
    toast({
      title: "Delivery Created",
      description: "Delivery has been set up successfully",
    });
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={statusColors[order.status]}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
            <div className="text-sm text-gray-500">Order #{order._id}</div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-medium">Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₱{order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee:</span>
              <span>₱{order.paymentInfo.platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total:</span>
              <span>
                ₱
                {(order.totalAmount + order.paymentInfo.platformFee).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="space-y-2">
            <h3 className="font-medium">Shipping Address</h3>
            <div className="text-sm">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Delivery Section */}
          {order.status !== "cancelled" && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <h3 className="font-medium">Delivery</h3>
              </div>

              {order.delivery?.lalamoveOrderId ? (
                <DeliveryTracking
                  orderId={order._id}
                  onStatusUpdate={handleStatusUpdate}
                />
              ) : (
                isSeller &&
                !isDeliverySetup && (
                  <CreateDelivery
                    order={order}
                    onDeliveryCreated={handleDeliveryCreated}
                  />
                )
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal;
