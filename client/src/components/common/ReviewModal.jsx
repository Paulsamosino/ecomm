import React, { useState, useEffect } from 'react';
import { Star, X } from 'lucide-react';
import { apiAddReview } from '../../api/products';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const ReviewModal = ({ isOpen, onClose, productId, onReviewAdded, editingReview = null }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Update form when editing review or modal opens/closes
  useEffect(() => {
    if (editingReview && isOpen) {
      setRating(editingReview.rating);
      setComment(editingReview.comment);
    } else if (!isOpen) {
      // Reset form when modal closes
      setRating(0);
      setComment('');
      setError('');
      setHoveredRating(0);
    }
  }, [editingReview, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let response;
      
      if (editingReview) {
        // Update existing review
        response = await axiosInstance.put(`/reviews/review/${editingReview._id}`, {
          rating,
          comment: comment.trim()
        });
      } else {
        // Create new review
        response = await apiAddReview(productId, {
          rating,
          comment: comment.trim()
        });
      }
      
      // Call the callback to update the parent component
      onReviewAdded(response.data);
      
      // Reset form (modal closing will be handled by parent)
      setRating(0);
      setComment('');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label 
              htmlFor="comment" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Review *
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Share your experience with this product..."
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !rating || !comment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md transition-colors"
            >
              {isSubmitting ? 'Submitting...' : (editingReview ? 'Update Review' : 'Submit Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
