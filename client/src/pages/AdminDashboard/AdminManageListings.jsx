import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Edit,
  Trash2,
  AlertCircle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axios";
import {
  apiGetAllListings,
  apiUpdateListingStatus,
  apiDeleteListing,
} from "@/api/admin";

const AdminManageListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      return;
    }
    fetchListings();
  }, [isAdmin]);

  const fetchListings = async () => {
    try {
      console.log("Fetching listings...");
      const data = await apiGetAllListings();
      console.log("Listings response:", data);
      setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      console.error("Error details:", {
        response: error.response,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      toast.error(error.response?.data?.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (listingId, newStatus) => {
    try {
      await apiUpdateListingStatus(listingId, newStatus);
      toast.success("Listing status updated successfully");
      fetchListings();
    } catch (error) {
      console.error("Error updating listing status:", error);
      toast.error("Failed to update listing status");
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      await apiDeleteListing(listingId);
      toast.success("Listing deleted successfully");
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const filteredListings = listings
    .filter((listing) => {
      const matchesSearch = listing.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || listing.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        default:
          return 0;
      }
    });

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
        <h1 className="text-3xl font-bold mb-2">Manage Listings</h1>
        <p className="text-gray-600">Review and moderate product listings</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search listings..."
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
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
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
                  <option value="price-high">Highest Price</option>
                  <option value="price-low">Lowest Price</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-4">Product</th>
                <th className="text-left py-4 px-4">Seller</th>
                <th className="text-left py-4 px-4">Price</th>
                <th className="text-left py-4 px-4">Status</th>
                <th className="text-left py-4 px-4">Listed Date</th>
                <th className="text-right py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredListings.map((listing) => (
                <tr key={listing._id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.images[0]}
                        alt={listing.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium">{listing.name}</p>
                        <p className="text-sm text-gray-500">
                          {listing.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-medium">
                      {listing.seller?.name || "Unknown Seller"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {listing.seller?.email || "No email provided"}
                    </p>
                  </td>
                  <td className="py-4 px-4">₱{listing.price.toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <select
                      className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      value={listing.status}
                      onChange={(e) =>
                        handleUpdateStatus(listing._id, e.target.value)
                      }
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="py-4 px-4">
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      {listing.reportCount > 0 && (
                        <div className="flex items-center text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {listing.reportCount}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteListing(listing._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredListings.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listings found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No product listings available"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManageListings;
