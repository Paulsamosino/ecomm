import React, { useState, useEffect } from "react";
import { ShoppingCart, Search, Filter, ArrowUpDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const CartItem = ({ item }) => (
  <div className="flex items-center justify-between py-4 border-b last:border-0">
    <div className="flex items-center space-x-4">
      <img
        src={item.product.images[0]}
        alt={item.product.name}
        className="w-16 h-16 object-cover rounded"
      />
      <div>
        <h3 className="font-medium">{item.product.name}</h3>
        <p className="text-sm text-gray-600">
          Quantity: {item.quantity} • ${item.product.price}
        </p>
      </div>
    </div>
    <p className="font-medium">
      ${(item.quantity * item.product.price).toFixed(2)}
    </p>
  </div>
);

const SellerCartManagement = () => {
  const [activeCarts, setActiveCarts] = useState([]);
  const [abandonedCarts, setAbandonedCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch active carts
      const activeRes = await fetch("/api/seller/carts/active", { headers });
      const activeData = await activeRes.json();
      setActiveCarts(activeData);

      // Fetch abandoned carts
      const abandonedRes = await fetch("/api/seller/carts/abandoned", {
        headers,
      });
      const abandonedData = await abandonedRes.json();
      setAbandonedCarts(abandonedData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching carts:", error);
      setLoading(false);
    }
  };

  const sendReminder = async (cartId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/seller/carts/${cartId}/remind`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update UI to show reminder sent
      setAbandonedCarts(
        abandonedCarts.map((cart) =>
          cart._id === cartId ? { ...cart, reminderSent: true } : cart
        )
      );
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cart Management</h1>
        <p className="text-gray-600">
          Monitor active and abandoned shopping carts
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer name or ID..."
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
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Carts</option>
                <option value="active">Active</option>
                <option value="abandoned">Abandoned</option>
              </select>
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="value-high">Highest Value</option>
                <option value="value-low">Lowest Value</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Active Carts Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Carts</h2>
          {activeCarts.length > 0 ? (
            <div className="space-y-4">
              {activeCarts.map((cart) => (
                <div key={cart._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium">{cart.customer.name}</h3>
                      <p className="text-sm text-gray-600">
                        Last updated:{" "}
                        {new Date(cart.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        Total: ${cart.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {cart.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <CartItem key={item._id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No active carts</p>
          )}
        </div>

        {/* Abandoned Carts Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Abandoned Carts</h2>
          {abandonedCarts.length > 0 ? (
            <div className="space-y-4">
              {abandonedCarts.map((cart) => (
                <div key={cart._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-medium">{cart.customer.name}</h3>
                      <p className="text-sm text-gray-600">
                        Abandoned:{" "}
                        {new Date(cart.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminder(cart._id)}
                      disabled={cart.reminderSent}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {cart.reminderSent ? "Reminder Sent" : "Send Reminder"}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <CartItem key={item._id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No abandoned carts</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerCartManagement;
