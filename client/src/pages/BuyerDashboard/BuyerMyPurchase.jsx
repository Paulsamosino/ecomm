import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axios";
import { socketService } from "@/services/socket";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "react-hot-toast";
import {
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Star as StarIcon,
  Bird,
  Leaf,
  Sun,
  CloudRain,
  ShoppingBag,
  ArrowUpDown,
  Egg,
  Wheat,
  X,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const OrderTrackingStatus = ({ order }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const deliveryDateEstimate = () => {
    if (order.status === "shipped") {
      const shipDate = new Date(order.updatedAt);
      const deliveryDate = new Date(shipDate);
      deliveryDate.setDate(shipDate.getDate() + 3); // Assuming 3 days for delivery
      return format(deliveryDate, "EEE, MMM d");
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex flex-col gap-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(
              order.status
            )}`}
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>

        {/* Tracking Info */}
        {order.trackingNumber && order.status === "shipped" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Tracking ID:</span>
              <span className="font-mono text-orange-600 ml-2">
                {order.trackingNumber}
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Truck className="w-4 h-4 mr-2 text-orange-500" />
              Expected delivery: {deliveryDateEstimate()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewModal = ({ order, isOpen, onClose, onReviewSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReviewSubmit(order._id, { rating, comment });
      onClose();
      toast.success("Review submitted successfully");
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-2xl border border-orange-100">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            Rate Your Purchase
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Share your experience with this product
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="mb-2">
              <div className="flex items-center justify-center mb-1">
                <Egg className="w-8 h-8 text-orange-400" />
                <span className="mx-2 text-gray-400">→</span>
                <Wheat className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {order.items[0]?.product?.name || "Product"}
              </p>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <StarIcon
                    className={`w-8 h-8 ${
                      rating >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-medium mt-2 text-gray-700">
              {rating === 5
                ? "Excellent!"
                : rating === 4
                ? "Good!"
                : rating === 3
                ? "Average"
                : rating === 2
                ? "Fair"
                : "Poor"}
            </p>
          </div>

          <div>
            <Textarea
              placeholder="Share your thoughts about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20 resize-none"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const OrderCard = ({ order, onReviewSubmit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReviewClick = () => {
    setIsReviewModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-orange-100 text-orange-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentMethod = () => {
    return order.paymentMethod || "Credit Card";
  };

  const formatShippingAddress = (address) => {
    if (!address) return "No shipping address provided";
    return `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-4 transition-all hover:shadow-md hover:border-orange-200">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-800">
                Order #{order._id.slice(-6)}
              </h3>
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              {order.reviewed && (
                <span className="bg-green-100 text-green-800 px-2 py-0.5 text-xs rounded-full">
                  Reviewed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <Clock className="h-3 w-3 mr-1 text-orange-400" />
              Ordered on {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">
              ₱{order.totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {order.items.length} items
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          {order.items.slice(0, 2).map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-3 bg-orange-50 p-2 rounded-lg border border-orange-100"
            >
              <div className="h-14 w-14 rounded-md overflow-hidden bg-white border border-orange-200">
                <img
                  src={item.product?.images?.[0] || "/placeholder.jpg"}
                  alt={item.product?.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-800">
                  {item.product?.name || "Product"}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  ₱{item.price?.toLocaleString()} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
          {order.items.length > 2 && (
            <div className="flex items-center text-sm text-orange-600">
              +{order.items.length - 2} more items
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-orange-100">
            <OrderTrackingStatus order={order} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1 flex items-center">
                  <Truck className="h-4 w-4 mr-1 text-orange-500" />
                  Shipping Details
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Address:</span>{" "}
                  {formatShippingAddress(order.shippingAddress)}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Method:</span>{" "}
                  {order.shippingMethod || "Standard Shipping"}
                </p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-1 flex items-center">
                  <Wheat className="h-4 w-4 mr-1 text-orange-500" />
                  Payment Information
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  <span className="font-medium">Method:</span>{" "}
                  {getPaymentMethod()}
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium">Total:</span> ₱
                  {order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-between items-center gap-2 mt-4 pt-3 border-t border-orange-100">
          <button
            onClick={toggleExpand}
            className="text-orange-600 text-sm font-medium flex items-center hover:text-orange-500 focus:outline-none"
          >
            {isExpanded ? "Show Less" : "View Details"}
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </button>
          <div className="flex gap-2">
            {order.status === "delivered" && !order.reviewed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReviewClick}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <StarIcon className="h-4 w-4 mr-1" />
                Leave Review
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Get Help
            </Button>
          </div>
        </div>
      </div>
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
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Sync searchQuery with searchTerm
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Sync selectedTab with activeTab
  useEffect(() => {
    setActiveTab(selectedTab);
  }, [selectedTab]);

  // Fetch orders from the API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/orders/my");
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch orders. Please try again later."
      );
      toast.error("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize socket connection and set up event listeners
  useEffect(() => {
    let socket;

    const initializeSocket = async () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No authentication token found");
          return;
        }

        // Connect to socket server
        socket = await socketService.connect(token, { isSeller: false });

        if (socket) {
          // Set up event listeners
          socket.on("orderStatusUpdated", (updatedOrder) => {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order._id === updatedOrder._id ? updatedOrder : order
              )
            );
            toast.success(
              `Order #${updatedOrder._id.slice(-6)} status updated to ${
                updatedOrder.status
              }`
            );
          });

          socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
            toast.error(
              "Connection to server lost. Some features may not work."
            );
          });
        }
      } catch (error) {
        console.error("Error initializing socket:", error);
      }
    };

    // Initialize socket and fetch orders
    fetchOrders();
    initializeSocket();

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("orderStatusUpdated");
        socket.off("connect_error");
      }
    };
  }, [fetchOrders]);

  const handleReviewSubmit = async (orderId, review) => {
    try {
      await axiosInstance.post(`/orders/${orderId}/review`, review);
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, reviewed: true } : order
        )
      );
      toast.success("Review submitted successfully");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
      throw error; // Re-throw to be caught by the caller
    }
  };

  // Filter orders based on status
  const filterOrders = useCallback(
    (status) => {
      if (status === "all") return orders;
      return orders.filter((order) => order.status === status);
    },
    [orders]
  );

  // Search orders based on search term
  const searchOrders = useCallback(
    (ordersToSearch) => {
      if (!searchTerm.trim()) return ordersToSearch;
      const term = searchTerm.toLowerCase();

      return ordersToSearch.filter((order) => {
        // Search by order ID
        if (order._id.toLowerCase().includes(term)) return true;

        // Search by product name
        return order.items.some((item) =>
          item.product.name.toLowerCase().includes(term)
        );
      });
    },
    [searchTerm]
  );

  // Get filtered and searched orders
  const getFilteredOrders = useCallback(() => {
    const filtered = filterOrders(activeTab);
    return searchOrders(filtered);
  }, [activeTab, filterOrders, searchOrders]);

  // Helper function to render the order list
  const renderOrderList = (orders) => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-orange-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500">
            We couldn't find any orders matching your criteria.
          </p>
        </div>
      );
    }

    return orders.map((order) => (
      <OrderCard
        key={order._id}
        order={order}
        onReviewSubmit={handleReviewSubmit}
      />
    ));
  };

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="mb-4">
          <ShoppingBag className="w-12 h-12 text-orange-500 mx-auto animate-pulse" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Loading Your Orders
        </h3>
        <div className="w-48 h-2 bg-orange-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full animate-progress"></div>
        </div>
      </div>
    );
  }

  // Progress animation is defined in tailwind.config.cjs

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center p-8 bg-white rounded-xl shadow-sm border border-orange-100 mt-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Unable to Load Orders
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={fetchOrders}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" className="border-gray-300">
            <HelpCircle className="w-4 h-4 mr-2" />
            Get Help
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-orange-100 rounded-lg mr-3">
            <ShoppingBag className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-500">
              Track, return, or buy things again
            </p>
          </div>
        </div>
        <div className="w-full lg:w-80">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by order # or product..."
              className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-75 transition-opacity"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <div className="border-b border-orange-100">
          <div className="max-w-full overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent w-max flex">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="processing"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                Processing
              </TabsTrigger>
              <TabsTrigger
                value="shipped"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                Shipped
              </TabsTrigger>
              <TabsTrigger
                value="delivered"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                Delivered
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none min-w-[100px] flex-shrink-0"
              >
                Completed
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
          <TabsContent value="pending" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
          <TabsContent value="processing" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
          <TabsContent value="shipped" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
          <TabsContent value="delivered" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
          <TabsContent value="completed" className="pt-4">
            {renderOrderList(getFilteredOrders())}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default BuyerMyPurchase;
