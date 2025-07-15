import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Upload,
  ExternalLink,
  TrendingUp,
  MousePointer,
  Users
} from 'lucide-react';
import { 
  apiGetAds, 
  apiCreateAd, 
  apiUpdateAd, 
  apiDeleteAd, 
  apiUpdateAdStatus,
  apiGetAdStats,
  apiUploadAdImage
} from '@/api/admin';
import toast from 'react-hot-toast';

const AdminAdsPage = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [adStats, setAdStats] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    url: '',
    price: '',
    ctaText: '',
    type: 'banner',
    backgroundColor: 'from-blue-500 to-blue-600',
    status: 'active'
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const data = await apiGetAds();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAd) {
        const adId = editingAd._id || editingAd.id;
        await apiUpdateAd(adId, formData);
        toast.success('Ad updated successfully');
      } else {
        await apiCreateAd(formData);
        toast.success('Ad created successfully');
      }
      fetchAds();
      closeModal();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error('Failed to save ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (adId) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await apiDeleteAd(adId);
        toast.success('Ad deleted successfully');
        fetchAds();
      } catch (error) {
        console.error('Error deleting ad:', error);
        toast.error('Failed to delete ad');
      }
    }
  };

  const handleStatusToggle = async (adId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await apiUpdateAdStatus(adId, newStatus);
      toast.success(`Ad ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchAds();
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast.error('Failed to update ad status');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        const result = await apiUploadAdImage(file);
        setFormData({ ...formData, image: result.imageUrl });
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
      }
    }
  };

  const openStatsModal = async (ad) => {
    try {
      setSelectedAd(ad);
      const adId = ad._id || ad.id;
      const stats = await apiGetAdStats(adId);
      setAdStats(stats);
      setShowStats(true);
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      toast.error('Failed to load ad statistics');
    }
  };

  const openEditModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description,
        image: ad.image,
        url: ad.url,
        price: ad.price || '',
        ctaText: ad.ctaText || '',
        type: ad.type,
        backgroundColor: ad.backgroundColor || 'from-blue-500 to-blue-600',
        status: ad.status
      });
    } else {
      setEditingAd(null);
      setFormData({
        title: '',
        description: '',
        image: '',
        url: '',
        price: '',
        ctaText: '',
        type: 'banner',
        backgroundColor: 'from-blue-500 to-blue-600',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      image: '',
      url: '',
      price: '',
      ctaText: '',
      type: 'banner',
      backgroundColor: 'from-blue-500 to-blue-600',
      status: 'active'
    });
  };

  const backgroundOptions = [
    { value: 'from-blue-500 to-blue-600', label: 'Blue Gradient' },
    { value: 'from-green-500 to-green-600', label: 'Green Gradient' },
    { value: 'from-purple-500 to-purple-600', label: 'Purple Gradient' },
    { value: 'from-red-500 to-red-600', label: 'Red Gradient' },
    { value: 'from-yellow-500 to-yellow-600', label: 'Yellow Gradient' },
    { value: 'from-indigo-500 to-indigo-600', label: 'Indigo Gradient' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading ads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
          <p className="text-gray-600">Create and manage ads shown to buyers</p>
        </div>
        <button
          onClick={() => openEditModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Ad
        </button>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <div key={ad._id || ad.id || `ad-${Math.random()}`} className="bg-white border rounded-lg overflow-hidden shadow-sm">
            {/* Ad Preview */}
            <div className="relative">
              {ad.image && (
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                ad.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {ad.status}
              </div>
            </div>

            {/* Ad Details */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{ad.title}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ad.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="bg-gray-100 px-2 py-1 rounded">{ad.type}</span>
                {ad.url && (
                  <a 
                    href={ad.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(ad)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleStatusToggle(ad._id || ad.id, ad.status)}
                    className={`p-1 ${ad.status === 'active' ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'}`}
                    title={ad.status === 'active' ? 'Deactivate' : 'Activate'}
                  >
                    {ad.status === 'active' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openStatsModal(ad)}
                    className="text-purple-600 hover:text-purple-800 p-1"
                    title="View Stats"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad._id || ad.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {ad.clickCount || 0} clicks
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {ads.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ads created yet</h3>
          <p className="text-gray-600 mb-4">Create your first advertisement to start promoting to buyers.</p>
          <button
            onClick={() => openEditModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Your First Ad
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ad title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="banner">Banner (Large)</option>
                      <option value="square">Square (Medium)</option>
                      <option value="small">Small (Sidebar)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Ad description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="w-full"
                      />
                      {uploading && (
                        <p className="text-sm text-blue-600 mt-1">Uploading image...</p>
                      )}
                    </div>
                    {formData.image && (
                      <div className="relative">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPG, PNG, GIF, WEBP (Max 10MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="example.com or www.example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter URL without https:// - it will be added automatically
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="₱99.99"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Call-to-Action Text
                    </label>
                    <input
                      type="text"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Learn More"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Background (Banner only)
                    </label>
                    <select
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {backgroundOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : (editingAd ? 'Update Ad' : 'Create Ad')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && selectedAd && adStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Ad Statistics</h2>
              <h3 className="text-lg font-medium text-gray-900 mb-4">{selectedAd.title}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Total Clicks</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{adStats.totalClicks || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Total Impressions</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{adStats.totalImpressions || 0}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Click Rate</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {adStats.totalImpressions > 0 
                      ? `${((adStats.totalClicks / adStats.totalImpressions) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">Unique Viewers</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">{adStats.uniqueViewers || 0}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <button
                  onClick={() => setShowStats(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdsPage;
