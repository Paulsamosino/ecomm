import React, { useState, useEffect } from "react";
import { Package, Search, Filter, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "@/config/constants";
import axiosInstance from "@/services/axiosInstance";

const OrderStatusBadge = ({ status }) => {
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    conversionRate: 0,
  });
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    fetchOrders();
    fetchMetrics();
  }, [timeframe]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/seller/orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/seller/orders/metrics?timeframe=${timeframe}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Set metrics with default values for any missing fields
      setMetrics({
        totalOrders: data.totalOrders || 0,
        completedOrders: data.completedOrders || 0,
        cancelledOrders: data.cancelledOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        averageOrderValue: data.averageOrderValue || 0,
        conversionRate: data.conversionRate || 0,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Failed to fetch metrics");
      // Reset metrics to defaults on error
      setMetrics({
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        conversionRate: 0,
      });
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let trackingNumber;
      if (newStatus === "shipped") {
        trackingNumber = await showTrackingNumberDialog();
        if (!trackingNumber) return;
      }

      const response = await axiosInstance.put(
        `/seller/orders/${orderId}/status`,
        {
          status: newStatus,
          trackingNumber,
        }
      );

      const updatedOrder = response.data;

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, ...updatedOrder } : order
        )
      );

      toast.success(`Order status updated to ${newStatus}`);

      // Status-specific actions
      if (newStatus === "completed") {
        toast("Don't forget to follow up on customer satisfaction!", {
          description: "A review request has been sent to the customer.",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  const showTrackingNumberDialog = () => {
    return new Promise((resolve) => {
      const trackingNumber = prompt("Enter tracking number:");
      resolve(trackingNumber);
    });
  };

  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.buyer?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "amount") {
        return sortOrder === "desc"
          ? b.totalAmount - a.totalAmount
          : a.totalAmount - b.totalAmount;
      }
      return 0;
    });

  const formattedMetrics = {
    totalRevenue: metrics?.totalRevenue?.toFixed(2) || "0.00",
    averageOrderValue: metrics?.averageOrderValue?.toFixed(2) || "0.00",
    conversionRate: metrics?.conversionRate?.toFixed(1) || "0.0",
    totalOrders: metrics?.totalOrders || 0,
    completedOrders: metrics?.completedOrders || 0,
    cancelledOrders: metrics?.cancelledOrders || 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orders</h1>
        <p className="text-gray-600">Manage and track your orders</p>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-medium">{metrics?.totalOrders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="text-green-600 font-medium">
                {metrics?.completedOrders || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cancelled:</span>
              <span className="text-red-600 font-medium">
                {metrics?.cancelledOrders || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-medium">
                ₱{(metrics?.totalRevenue || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Order:</span>
              <span className="font-medium">
                ₱{(metrics?.averageOrderValue || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate:</span>
              <span className="font-medium">
                {(metrics?.conversionRate || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Time Period</h3>
          <select
            className="w-full border rounded-lg p-2"
            value={timeframe}
            onChange={(e) => setTimeframe(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-4">Order ID</th>
                <th className="text-left py-4 px-4">Customer</th>
                <th className="text-left py-4 px-4">Products</th>
                <th className="text-left py-4 px-4">Date</th>
                <th className="text-left py-4 px-4">Amount</th>
                <th className="text-left py-4 px-4">Status</th>
                <th className="text-left py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400 mr-2" />#
                      {order._id.slice(-6)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{order.buyer?.name}</p>
                      <p className="text-sm text-gray-600">
                        {order.buyer?.email}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      {order.items.map((item, index) => (
                        <div key={index} className="mb-1 last:mb-0">
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">₱{order.totalAmount.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="py-4 px-4">
                    <select
                      className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(order._id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No orders found
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter"
                : "Orders will appear here when customers make purchases"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
