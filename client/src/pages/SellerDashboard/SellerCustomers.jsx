import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Star,
  Users,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import { getSellerCustomers } from "@/api/seller";
import { toast } from "react-hot-toast";

const SellerCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getSellerCustomers();
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Convert customers data to CSV
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Location",
      "Orders",
      "Total Spent",
      "Last Purchase",
      "Status",
    ];
    const csvData = customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone,
      `${customer.city}, ${customer.state}`,
      customer.totalOrders,
      customer.totalSpent.toFixed(2),
      new Date(customer.lastPurchase).toLocaleDateString(),
      customer.status,
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map((row) => row.join(","))
      .join("\\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("Customer list exported successfully");
  };

  const filteredCustomers = customers
    .filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || customer.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.lastPurchase) - new Date(a.lastPurchase);
        case "oldest":
          return new Date(a.lastPurchase) - new Date(b.lastPurchase);
        case "orders-high":
          return b.totalOrders - a.totalOrders;
        case "orders-low":
          return a.totalOrders - b.totalOrders;
        case "spent-high":
          return b.totalSpent - a.totalSpent;
        case "spent-low":
          return a.totalSpent - b.totalSpent;
        default:
          return 0;
      }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-gray-600">Manage and view customer information</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Total Customers: {customers.length}
          </span>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
          >
            <Calendar className="h-5 w-5" />
            Export List
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
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
                  <option value="orders-high">Most Orders</option>
                  <option value="orders-low">Least Orders</option>
                  <option value="spent-high">Highest Spent</option>
                  <option value="spent-low">Lowest Spent</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Customer
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Contact
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Location
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Orders
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Total Spent
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Last Purchase
                </th>
                <th className="text-left py-4 px-4 text-gray-600 font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {customer.name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span>{customer.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {customer.city}, {customer.state}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-gray-400" />
                      <span>{customer.totalOrders}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    ₱{customer.totalSpent.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p>
                        {new Date(customer.lastPurchase).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(customer.lastPurchase).toLocaleTimeString()}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.status === "active"
                          ? "bg-green-100 text-green-800"
                          : customer.status === "inactive"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {customer.status.charAt(0).toUpperCase() +
                        customer.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No customers found
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Customers will appear here when they make purchases"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerCustomers;
