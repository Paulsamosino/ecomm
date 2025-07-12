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

  useEffect(() => {
    fetchOrders();
  }, []);

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
                <th className="text-left py-4 px-4">Shipping Address</th>
                <th className="text-left py-4 px-4">Date</th>
                <th className="text-left py-4 px-4">Amount</th>
                <th className="text-left py-4 px-4">Status</th>
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
                      <p>
                        {order.shippingAddress?.street},{" "}
                        {order.shippingAddress?.city},{" "}
                        {order.shippingAddress?.state},{" "}
                        {order.shippingAddress?.zipCode},{" "}
                        {order.shippingAddress?.country}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.shippingAddress?.phone}
                      </p>
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
