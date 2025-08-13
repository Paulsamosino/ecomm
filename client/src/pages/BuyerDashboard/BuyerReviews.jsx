import React, { useState, useEffect } from 'react';
import { Star, Edit3, Trash2, Package, Calendar, Clock } from 'lucide-react';
import axiosInstance from '../../api/axios';
import ReviewModal from '../../components/common/ReviewModal';

const BuyerReviews = () => {
  const [activeTab, setActiveTab] = useState('my-reviews');
  const [myReviews, setMyReviews] = useState([]);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-reviews') {
        const response = await axiosInstance.get('/reviews/my-reviews');
        setMyReviews(response.data);
      } else {
        const response = await axiosInstance.get('/reviews/eligible-products');
        setEligibleProducts(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await axiosInstance.delete(`/reviews/review/${reviewId}`);
      setMyReviews(prev => prev.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review. Please try again.');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleWriteReview = (product) => {
    setSelectedProduct(product);
    setEditingReview(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingReview(null);
    setSelectedProduct(null);
  };

  const handleReviewAdded = async () => {
    // Refresh data first
    await fetchData();
    // Then close modal
    handleModalClose();
  };

  const renderStars = (rating) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-1">Manage your product reviews and write new ones</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-reviews'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Reviews ({myReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pending'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Write Reviews ({eligibleProducts.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'my-reviews' ? (
            <div className="space-y-6">
              {myReviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by purchasing products and leaving reviews to help other buyers.
                  </p>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Check Eligible Products
                  </button>
                </div>
              ) : (
                myReviews.map((review) => (
                  <div key={review._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <img
                          src={review.product.image}
                          alt={review.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = '/1f425.png'; // Fallback image
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.product.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600">
                              ({review.rating}/5)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditReview(review)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Review"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(review._id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {eligibleProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No products to review</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Purchase and receive products to write reviews and help other buyers.
                  </p>
                  <a
                    href="/products"
                    className="mt-4 inline-block bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Browse Products
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Products You Can Review
                    </h2>
                    <p className="text-sm text-gray-600">
                      These are products you've purchased and received. Your reviews help other buyers make informed decisions.
                    </p>
                  </div>
                  
                  {eligibleProducts.map((product) => (
                    <div key={product._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src = '/1f425.png'; // Fallback image
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>Delivered on {formatDate(product.deliveredAt)}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleWriteReview(product)}
                          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                        >
                          Write Review
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        productId={selectedProduct?._id || editingReview?.product._id}
        onReviewAdded={handleReviewAdded}
        editingReview={editingReview}
      />
    </div>
  );
};

export default BuyerReviews;
