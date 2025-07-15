import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Search,
  Filter,
  Upload,
  ExternalLink,
  MonitorPlay
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { apiGetAds, apiCreateAd, apiUpdateAd, apiDeleteAd, apiGetAdStats } from "@/api/admin";

const AdCard = ({ ad, onEdit, onDelete, onToggleStatus, onViewStats }) => {
  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800", 
    draft: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800"
  };

  const typeColors = {
    banner: "bg-blue-100 text-blue-800",
    square: "bg-purple-100 text-purple-800", 
    small: "bg-indigo-100 text-indigo-800"
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      {/* Ad Preview */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[ad.type]}`}>
              {ad.type.charAt(0).toUpperCase() + ad.type.slice(1)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ad.status]}`}>
              {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <BarChart3 className="h-3 w-3" />
            {ad.clicks || 0} clicks
          </div>
        </div>

        {/* Ad Preview based on type */}
        <div className={`border rounded-lg overflow-hidden ${
          ad.type === 'banner' ? 'h-20' : 
          ad.type === 'square' ? 'h-32' : 'h-16'
        }`}>
          {ad.image ? (
            <img 
              src={ad.image} 
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="font-semibold text-gray-900 text-sm">{ad.title}</h3>
          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{ad.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">{ad.sponsor}</span>
            {ad.price && (
              <span className="text-xs font-medium text-green-600">{ad.price}</span>
            )}
          </div>
        </div>
      </div>

      {/* Ad Controls */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(ad._id, ad.status === 'active' ? 'paused' : 'active')}
            >
              {ad.status === 'active' ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => onViewStats(ad)}>
              <BarChart3 className="h-3 w-3 mr-1" />
              Stats
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onEdit(ad)}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(ad._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Impressions</p>
            <p className="text-sm font-medium">{ad.impressions || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="text-sm font-medium">{ad.clicks || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CTR</p>
            <p className="text-sm font-medium">
              {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdFormModal = ({ ad, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "banner",
    image: "",
    url: "",
    cta: "",
    sponsor: "",
    price: "",
    status: "draft"
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title || "",
        description: ad.description || "",
        type: ad.type || "banner",
        image: ad.image || "",
        url: ad.url || "",
        cta: ad.cta || "",
        sponsor: ad.sponsor || "",
        price: ad.price || "",
        status: ad.status || "draft"
      });
    } else {
      setFormData({
        title: "",
        description: "",
        type: "banner",
        image: "",
        url: "",
        cta: "",
        sponsor: "",
        price: "",
        status: "draft"
      });
    }
  }, [ad, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (ad) {
        await onSave({ ...formData, _id: ad._id });
      } else {
        await onSave(formData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving ad:", error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Here you would upload to your storage service
      // For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      setImageFile(file);
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {ad ? "Edit Advertisement" : "Create New Advertisement"}
          </h2>
          <Button variant="outline" onClick={onClose}>
            ×
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ad title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="banner">Banner (Wide)</option>
                <option value="square">Square (Medium)</option>
                <option value="small">Small (Compact)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Ad description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sponsor/Company *</label>
              <Input
                value={formData.sponsor}
                onChange={(e) => setFormData(prev => ({ ...prev, sponsor: e.target.value }))}
                placeholder="Company name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Call to Action *</label>
              <Input
                value={formData.cta}
                onChange={(e) => setFormData(prev => ({ ...prev, cta: e.target.value }))}
                placeholder="e.g., Shop Now, Learn More"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target URL *</label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (Optional)</label>
              <Input
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="e.g., $29.99, Starting at $50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Image"}
              </label>
              {formData.image && (
                <div className="flex items-center gap-2">
                  <img src={formData.image} alt="Preview" className="h-10 w-10 object-cover rounded" />
                  <span className="text-sm text-green-600">Image uploaded</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {ad ? "Update Advertisement" : "Create Advertisement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatsModal = ({ ad, isOpen, onClose }) => {
  if (!isOpen || !ad) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Ad Performance - {ad.title}</h2>
          <Button variant="outline" onClick={onClose}>×</Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Impressions</p>
              <p className="text-2xl font-bold text-blue-600">{ad.impressions || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-green-600">{ad.clicks || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Click-Through Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0}%
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-lg font-semibold text-orange-600 capitalize">{ad.status}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Ad Details</p>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Type:</span> {ad.type}</p>
              <p><span className="font-medium">Sponsor:</span> {ad.sponsor}</p>
              <p><span className="font-medium">CTA:</span> {ad.cta}</p>
              {ad.price && <p><span className="font-medium">Price:</span> {ad.price}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-gray-500" />
            <a 
              href={ad.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              {ad.url}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminManageAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedAdForStats, setSelectedAdForStats] = useState(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      // For now, we'll use mock data that matches your current ads
      const mockAds = [
        {
          _id: "1",
          title: "Purina Pro Plan Poultry Feed",
          description: "Get 25% off premium layer feed. Free shipping on orders over $50!",
          type: "banner",
          image: null,
          url: "https://example.com/",
          cta: "Shop Now",
          sponsor: "Purina Store",
          price: "Starting at $24.99",
          status: "active",
          impressions: 1250,
          clicks: 47
        },
        {
          _id: "2", 
          title: "Automatic Chicken Coop Door",
          description: "Smart door with timer & light sensor. Keep your chickens safe 24/7",
          type: "banner",
          image: null,
          url: "https://example.com/",
          cta: "Learn More",
          sponsor: "ChickenGuard",
          price: "$89.99",
          status: "active",
          impressions: 980,
          clicks: 32
        },
        {
          _id: "3",
          title: "Farm Fresh Egg Cartons - Bulk Pack", 
          description: "Premium cardboard egg cartons. Perfect for selling your fresh eggs!",
          type: "banner",
          image: null,
          url: "https://example.com/",
          cta: "Order Now",
          sponsor: "PackagingPro",
          price: "100 pack - $32.99",
          status: "paused",
          impressions: 756,
          clicks: 18
        },
        {
          _id: "4",
          title: "Chicken Coop Heater",
          description: "Safe, energy-efficient heating for winter. Thermostat controlled.",
          type: "square",
          image: null,
          url: "https://example.com/",
          cta: "Buy Now",
          sponsor: "FarmTech",
          price: "$45.99",
          status: "active",
          impressions: 654,
          clicks: 28
        },
        {
          _id: "5",
          title: "Organic Layer Pellets",
          description: "Non-GMO certified feed for healthier hens and better eggs.",
          type: "square",
          image: null,
          url: "https://example.com/",
          cta: "Shop Feed",
          sponsor: "Nature's Best",
          price: "$28.50/bag",
          status: "active",
          impressions: 543,
          clicks: 21
        },
        {
          _id: "6",
          title: "Poultry Insurance",
          description: "Protect your flock with comprehensive livestock coverage",
          type: "small",
          image: null,
          url: "https://example.com/",
          cta: "Get Quote",
          sponsor: "AgriShield Insurance",
          price: "",
          status: "active",
          impressions: 432,
          clicks: 15
        },
        {
          _id: "7",
          title: "Free Farm Newsletter",
          description: "Weekly tips, market prices, and expert advice delivered to your inbox",
          type: "small",
          image: null,
          url: "https://example.com/",
          cta: "Subscribe",
          sponsor: "Modern Farmer",
          price: "",
          status: "draft",
          impressions: 0,
          clicks: 0
        }
      ];
      
      setAds(mockAds);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = () => {
    setEditingAd(null);
    setIsModalOpen(true);
  };

  const handleEditAd = (ad) => {
    setEditingAd(ad);
    setIsModalOpen(true);
  };

  const handleSaveAd = async (adData) => {
    try {
      if (editingAd) {
        // Update existing ad
        setAds(prev => prev.map(ad => 
          ad._id === editingAd._id ? { ...ad, ...adData } : ad
        ));
        toast.success("Advertisement updated successfully");
      } else {
        // Create new ad
        const newAd = {
          ...adData,
          _id: Date.now().toString(),
          impressions: 0,
          clicks: 0
        };
        setAds(prev => [...prev, newAd]);
        toast.success("Advertisement created successfully");
      }
    } catch (error) {
      console.error("Error saving ad:", error);
      toast.error("Failed to save advertisement");
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    try {
      setAds(prev => prev.filter(ad => ad._id !== adId));
      toast.success("Advertisement deleted successfully");
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast.error("Failed to delete advertisement");
    }
  };

  const handleToggleStatus = async (adId, newStatus) => {
    try {
      setAds(prev => prev.map(ad => 
        ad._id === adId ? { ...ad, status: newStatus } : ad
      ));
      toast.success(`Advertisement ${newStatus === 'active' ? 'activated' : 'paused'} successfully`);
    } catch (error) {
      console.error("Error updating ad status:", error);
      toast.error("Failed to update advertisement status");
    }
  };

  const handleViewStats = (ad) => {
    setSelectedAdForStats(ad);
    setStatsModalOpen(true);
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ad.sponsor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || ad.type === typeFilter;
    const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const adStats = {
    total: ads.length,
    active: ads.filter(ad => ad.status === 'active').length,
    paused: ads.filter(ad => ad.status === 'paused').length,
    draft: ads.filter(ad => ad.status === 'draft').length,
    totalClicks: ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0),
    totalImpressions: ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0)
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading advertisements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
            <p className="text-gray-600">Create and manage ads shown to buyers</p>
          </div>
          <Button onClick={handleCreateAd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Ad
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-2xl font-bold">{adStats.total}</p>
            </div>
            <MonitorPlay className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Ads</p>
              <p className="text-2xl font-bold text-green-600">{adStats.active}</p>
            </div>
            <Eye className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-purple-600">{adStats.totalClicks}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg CTR</p>
              <p className="text-2xl font-bold text-orange-600">
                {adStats.totalImpressions > 0 
                  ? ((adStats.totalClicks / adStats.totalImpressions) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search ads by title or sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="banner">Banner</option>
              <option value="square">Square</option>
              <option value="small">Small</option>
            </select>
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAds.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MonitorPlay className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No advertisements found</p>
            <Button className="mt-4" onClick={handleCreateAd}>
              Create Your First Ad
            </Button>
          </div>
        ) : (
          filteredAds.map((ad) => (
            <AdCard
              key={ad._id}
              ad={ad}
              onEdit={handleEditAd}
              onDelete={handleDeleteAd}
              onToggleStatus={handleToggleStatus}
              onViewStats={handleViewStats}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <AdFormModal
        ad={editingAd}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAd}
      />

      <StatsModal
        ad={selectedAdForStats}
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
      />
    </div>
  );
};

export default AdminManageAds;
