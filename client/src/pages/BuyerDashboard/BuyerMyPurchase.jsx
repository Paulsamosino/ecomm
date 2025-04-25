import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Star as StarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { axiosInstance } from "@/contexts/axios";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { socketService } from "@/services/socketService";

const OrderTrackingStatus = ({ order }) => {
  const steps = [
    { status: "pending", label: "Order Placed", Icon: Package },
    { status: "processing", label: "Processing", Icon: Clock },
    { status: "shipped", label: "Shipped", Icon: Truck },
    { status: "delivered", label: "Delivered", Icon: CheckCircle },
    { status: "completed", label: "Completed", Icon: StarIcon },
  ];

  const currentStepIndex = steps.findIndex(
    (step) => step.status === order.status
  );

  return (
    <div className="mt-4 mb-6">
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const { Icon } = step;
          const isActive = index <= currentStepIndex;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.status}
              className="flex flex-col items-center flex-1"
            >
              <div className={`flex items-center ${!isLast ? "w-full" : ""}`}>
                <div
                  className={`
                  relative flex items-center justify-center w-8 h-8 rounded-full 
                  ${isActive ? "bg-primary" : "bg-gray-200"}
                `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-gray-500"
                    }`}
                  />
                </div>
                {!isLast && (
                  <div
                    className={`h-0.5 w-full ${
                      index < currentStepIndex ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <span
                className={`
                mt-2 text-xs font-medium
                ${isActive ? "text-primary" : "text-gray-500"}
              `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {order.trackingNumber && order.status === "shipped" && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Tracking Number:{" "}
            <span className="font-medium">{order.trackingNumber}</span>
          </p>
        </div>
      )}
    </div>
  );
};

const ReviewModal = ({ order, isOpen, onClose, onReviewSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Enhanced validation
      if (!rating) {
        toast.error("Please select a rating");
        return;
      }

      if (!comment.trim()) {
        toast.error("Please provide a comment");
        return;
      }

      if (comment.trim().length < 10) {
        toast.error("Comment must be at least 10 characters long");
        return;
      }

      if (comment.trim().length > 500) {
        toast.error("Comment must not exceed 500 characters");
        return;
      }

      // Simplified payload without redundant orderId
      const response = await axiosInstance.post(`/orders/${order._id}/review`, {
        rating,
        comment: comment.trim(),
        productId: order.items[0].product._id,
      });

      if (response.data) {
        toast.success("Review submitted successfully");
        onReviewSubmit();
        onClose();
        // Reset form
        setRating(5);
        setComment("");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit review. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white border shadow-lg">
        <DialogHeader className="bg-amber-50 -mx-6 -mt-6 p-6 border-b">
          <DialogTitle className="text-2xl font-semibold text-amber-900">
            Review Your Purchase
          </DialogTitle>
          <DialogDescription className="text-amber-700 mt-1">
            Share your experience with this product to help other farmers make
            better decisions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-amber-500/20 rounded-full p-1 transition-transform hover:scale-110"
                >
                  <StarIcon
                    className={`w-8 h-8 ${
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Comment
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with the product, delivery, and seller service..."
              rows={4}
              required
              minLength={10}
              maxLength={500}
              className="resize-none focus:ring-amber-500 bg-white border-gray-200"
            />
            <p className="mt-1 text-sm text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !comment.trim() || comment.length < 10}
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-300"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const OrderCard = ({ order, onReviewSubmit }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium">Order #{order._id.slice(-6)}</h3>
          <p className="text-sm text-gray-500">
            {format(new Date(order.createdAt), "MMM d, yyyy")}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            statusColors[order.status]
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <OrderTrackingStatus order={order} />

      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item._id} className="flex items-center space-x-4">
            <img
              src={item.product.images[0]}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h4 className="font-medium">{item.product.name}</h4>
              <p className="text-sm text-gray-600">
                Quantity: {item.quantity} × ₱{item.price.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total Amount:</span>
          <span className="font-medium">₱{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {order.status === "completed" && !order.review && (
        <div className="mt-4 pt-4 border-t">
          <Button
            onClick={() => setIsReviewModalOpen(true)}
            className="w-full"
            variant="outline"
          >
            <StarIcon className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {order.review && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-4 h-4 ${
                    i < order.review.rating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {new Date(order.review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-gray-600">{order.review.comment}</p>
        </div>
      )}

      <ReviewModal
        order={order}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmit={onReviewSubmit}
      />
    </div>
  );
};

const BuyerMyPurchase = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    fetchOrders();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const newSocket = socketService.getSocket();
    setSocket(newSocket);

    newSocket.on("orderUpdate", ({ orderId, status, trackingNumber }) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status, trackingNumber } : order
        )
      );

      // Show notification
      const message = {
        processing: "Your order is being processed",
        shipped: "Your order has been shipped",
        delivered: "Your order has been delivered",
        completed: "Your order is completed",
        cancelled: "Your order has been cancelled",
      }[status];

      if (message) {
        toast(message, {
          icon: status === "cancelled" ? "❌" : "✅",
          duration: 5000,
        });
      }
    });
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get("/orders/my");
      setOrders(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
      toast.error("Failed to load your orders. Please try again.");
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (status) => {
    if (!Array.isArray(orders)) return [];
    if (status === "all") return orders;
    return orders.filter((order) => order.status === status);
  };

  const searchOrders = (ordersToSearch) => {
    if (!Array.isArray(ordersToSearch)) return [];
    if (!searchTerm) return ordersToSearch;
    const searchLower = searchTerm.toLowerCase();
    return ordersToSearch.filter(
      (order) =>
        order._id.toLowerCase().includes(searchLower) ||
        order.items.some((item) =>
          item.product.name.toLowerCase().includes(searchLower)
        )
    );
  };

  const handleReviewSubmit = async () => {
    await fetchOrders();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-900 font-medium">{error}</p>
        <Button onClick={fetchOrders} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Purchases</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <Tabs
        defaultValue="all"
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-6 gap-4 bg-muted p-1">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">To Pay</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">To Receive</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {[
          "all",
          "pending",
          "processing",
          "shipped",
          "completed",
          "cancelled",
        ].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {searchOrders(filterOrders(status)).map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onReviewSubmit={handleReviewSubmit}
              />
            ))}
            {searchOrders(filterOrders(status)).length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No orders found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "Try adjusting your search"
                    : status === "all"
                    ? "You haven't made any purchases yet"
                    : `You don't have any ${status} orders`}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default BuyerMyPurchase;
