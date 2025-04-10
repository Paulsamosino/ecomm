import React, { useState, useEffect } from "react";
import { Star, Search, Filter, ChevronDown, MessageSquare } from "lucide-react";

const RatingStars = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

const SellerReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/seller/reviews", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setReviews(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
    }
  };

  const filteredReviews = reviews
    .filter((review) => {
      const matchesSearch =
        review.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRating =
        ratingFilter === "all" || review.rating === parseInt(ratingFilter);
      return matchesSearch && matchesRating;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "rating") {
        return sortOrder === "desc" ? b.rating - a.rating : a.rating - b.rating;
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

  const averageRating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : 0;

  const ratingCounts = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reviews</h1>
        <p className="text-gray-600">
          Manage and respond to your customer reviews
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-4">
              <h2 className="text-4xl font-bold text-gray-900">
                {averageRating}
              </h2>
              <RatingStars rating={Math.round(averageRating)} />
              <p className="text-gray-600 mt-2">
                {reviews.length} total reviews
              </p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center">
                  <div className="flex items-center w-24">
                    <span className="text-sm text-gray-600 mr-2">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${
                          ((ratingCounts[rating] || 0) / reviews.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm text-gray-600">
                    {ratingCounts[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search reviews..."
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
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                  >
                    <option value="all">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                  <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>

                <div className="relative">
                  <select
                    className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] =
                        e.target.value.split("-");
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="rating-desc">Highest Rating</option>
                    <option value="rating-asc">Lowest Rating</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <div
                  key={review._id}
                  className="border-b last:border-0 pb-6 last:pb-0"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium mr-2">{review.user.name}</h3>
                        <RatingStars rating={review.rating} />
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">{review.comment}</p>
                  {review.reply && (
                    <div className="bg-gray-50 rounded-lg p-4 ml-4">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="w-4 h-4 text-primary mr-2" />
                        <p className="font-medium">Your Response</p>
                      </div>
                      <p className="text-gray-700">{review.reply}</p>
                    </div>
                  )}
                </div>
              ))}

              {filteredReviews.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No reviews found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || ratingFilter !== "all"
                      ? "Try adjusting your search or filter"
                      : "Reviews will appear here when customers leave feedback"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerReviews;
