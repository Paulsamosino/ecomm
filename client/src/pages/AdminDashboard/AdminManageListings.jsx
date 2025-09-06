import React, { useState, useEffect } from "react";
import { Search, Edit, Trash2, Package, Eye, Calendar, MapPin, Star, AlertCircle, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const data = await apiGetAllListings();
      console.debug("apiGetAllListings response:", data);

      const listingsArray = Array.isArray(data)
        ? data
        : Array.isArray(data?.products)
        ? data.products
        : Array.isArray(data?.data)
        ? data.data
        : [];

      setListings(listingsArray);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings");
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

  const handleViewProduct = (listingId) => {
    const listing = listings.find(l => l._id === listingId);
    setSelectedListing(listing);
    setViewModalOpen(true);
  };

  const handleEditListing = (listingId) => {
    const listing = listings.find(l => l._id === listingId);
    setSelectedListing(listing);
    setEditModalOpen(true);
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      await apiDeleteListing(listingId);
      toast.success("Listing deleted successfully");
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-500'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-500'
      },
      suspended: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        dot: 'bg-red-500'
      },
      inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        dot: 'bg-gray-500'
      }
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const filteredListings = listings.filter((listing) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      listing.title?.toLowerCase().includes(searchLower) ||
      listing.name?.toLowerCase().includes(searchLower) ||
      listing.productName?.toLowerCase().includes(searchLower) ||
      listing.category?.toLowerCase().includes(searchLower) ||
      listing.seller?.name?.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading listings...</p>
            <p className="text-gray-500 text-sm mt-1">Please wait while we fetch the data</p>
          </div>
        </div>
      </div>
    );
  }

  // View Modal Component
  const ViewModal = () => {
    if (!viewModalOpen || !selectedListing) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
            <button
              onClick={() => setViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Images */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">Product Images</h3>
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="w-full">
                      <img
                        src={selectedListing.images[0]}
                        alt="Main product image"
                        className="w-full h-80 object-contain bg-white rounded-lg border border-gray-200 shadow-sm"
                      />
                    </div>
                    {/* Additional Images */}
                    {selectedListing.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedListing.images.slice(1).map((image, index) => (
                          <img
                            key={index + 1}
                            src={image}
                            alt={`Product ${index + 2}`}
                            className="w-full h-16 object-contain bg-white rounded border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-80 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No images available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Information */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Product Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Name</span>
                      <span className="text-gray-900 font-medium">{selectedListing.name || selectedListing.title || "Untitled Product"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Category</span>
                      <span className="text-gray-900">{selectedListing.category || "Uncategorized"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Price</span>
                      <span className="text-xl font-bold text-orange-600">₱{selectedListing.price?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Stock Quantity</span>
                      <span className="text-gray-900">{selectedListing.quantity || 0} units</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <div>{getStatusBadge(selectedListing.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Seller Information */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="text-md font-semibold mb-3 text-gray-900">Seller Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Seller Name</span>
                      <span className="text-gray-900">{selectedListing.seller?.name || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Email</span>
                      <span className="text-gray-900">{selectedListing.seller?.email || "No email"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>            {/* Description */}
            {selectedListing.description && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-gray-900">Description</h4>
                <p className="text-gray-700 leading-relaxed">{selectedListing.description}</p>
              </div>
            )}

            {/* Additional Details */}
            <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-lg font-semibold mb-4 text-gray-900">Additional Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Created Date</span>
                  <span className="text-gray-900">{formatDate(selectedListing.createdAt)}</span>
                </div>
                {selectedListing.location && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Location</span>
                    <span className="text-gray-900">{selectedListing.location}</span>
                  </div>
                )}
                {selectedListing.averageRating && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Rating</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-gray-900">{selectedListing.averageRating.toFixed(1)} ({selectedListing.reviews?.length || 0} reviews)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Modal Component
  const EditModal = () => {
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
      if (selectedListing) {
        setEditForm({
          name: selectedListing.name || selectedListing.title || "",
          category: selectedListing.category || "",
          price: selectedListing.price || "",
          quantity: selectedListing.quantity || "",
          description: selectedListing.description || "",
          status: selectedListing.status || "active"
        });
      }
    }, [selectedListing]);

    const handleSave = async () => {
      try {
        // Here you would call an API to update the listing
        // await apiUpdateListing(selectedListing._id, editForm);
        
        // For now, just update the local state
        setListings(prev => prev.map(listing => 
          listing._id === selectedListing._id 
            ? { ...listing, ...editForm }
            : listing
        ));
        
        toast.success("Listing updated successfully");
        setEditModalOpen(false);
      } catch (error) {
        console.error("Error updating listing:", error);
        toast.error("Failed to update listing");
      }
    };

    if (!editModalOpen || !selectedListing) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Edit Listing</h2>
            <button
              onClick={() => setEditModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={editForm.name || ""}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                value={editForm.category || ""}
                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
                <input
                  type="number"
                  value={editForm.price || ""}
                  onChange={(e) => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <input
                  type="number"
                  value={editForm.quantity || ""}
                  onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={editForm.status || "active"}
                onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editForm.description || ""}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Product description..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Listings</h1>
              <p className="text-gray-600 mt-1">Manage and review all product listings</p>
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Listings</p>
                <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
              </div>
              <Package className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-green-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {listings.filter(l => l.status === 'active').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-yellow-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {listings.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Suspended</p>
                <p className="text-2xl font-bold text-red-600">
                  {listings.filter(l => l.status === 'suspended').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search Listings
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name, category, or seller..."
                className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="lg:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Status
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending Review</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredListings.length === 0 ? (
          <div className="text-center p-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">No listings found</h3>
            <p className="text-gray-500 text-lg">
              {searchTerm || statusFilter !== "all" 
                ? "Try adjusting your search criteria"
                : "No product listings available at the moment"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                <tr>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Price & Stock
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-8 py-5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-8 py-5 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredListings.map((listing) => (
                  <tr key={listing._id} className="hover:bg-gray-50 transition-colors duration-200">
                    {/* Product Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {listing.images && listing.images[0] ? (
                            <img
                              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                              src={listing.images[0]}
                              alt={listing.name || listing.title || listing.productName || "Product"}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {listing.name || listing.title || listing.productName || "Untitled Product"}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {listing.category || "Uncategorized"}
                          </p>
                          {listing.location && (
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <p className="text-xs text-gray-500">{listing.location}</p>
                            </div>
                          )}
                          {listing.averageRating > 0 && (
                            <div className="flex items-center mt-1">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              <p className="text-xs text-gray-600">
                                {listing.averageRating?.toFixed(1)} ({listing.reviews?.length || 0} reviews)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Seller Column */}
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {listing.seller?.name || "Unknown Seller"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {listing.seller?.email || "No email"}
                        </p>
                      </div>
                    </td>

                    {/* Price & Stock Column */}
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          ₱{listing.price?.toFixed(2) || "0.00"}
                        </p>
                        <p className={`text-sm ${
                          (listing.quantity || 0) > 0 
                            ? (listing.quantity > 10 ? "text-green-600" : "text-yellow-600")
                            : "text-red-600"
                        }`}>
                          {listing.quantity || 0} in stock
                        </p>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-8 py-6">
                      <div className="space-y-3">
                        {getStatusBadge(listing.status)}
                        <select
                          className="w-full text-sm px-2 py-1 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                          value={listing.status}
                          onChange={(e) => handleUpdateStatus(listing._id, e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </td>

                    {/* Date Created Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(listing.createdAt)}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => handleViewProduct(listing._id)}
                          title="View Product Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                          onClick={() => handleEditListing(listing._id)}
                          title="Edit Listing"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          onClick={() => handleDeleteListing(listing._id)}
                          title="Delete Listing"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ViewModal />
      <EditModal />
    </div>
  );
};

export default AdminManageListings;

