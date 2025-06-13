import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { axiosInstance } from "@/contexts/axios";
import { apiGetProduct } from "@/api/products";
import {
  Star,
  MessageSquare,
  Truck,
  Package,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Heart,
  Share2,
  ShoppingCart,
  CheckCircle,
  Clock,
  Shield,
  MapPin,
  ArrowLeft,
  ChevronDown,
  Plus,
  Minus,
  Store,
  Flag,
  Egg,
  Wheat,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import ReportModal from "@/components/common/ReportModal";

const ProductDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } =
    useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setCurrentImageIndex(0); // Reset image index when loading a new product

      // Fetch product details from the real API
      const data = await apiGetProduct(id);

      if (!data) throw new Error("Product not found");

      setProduct(data);

      // Fetch similar products
      try {
        // Get products in the same category with similar characteristics
        const category = data.category || "all";
        const price = data.price || 0;
        const breed = data.breed;
        const age = data.age;

        // Calculate price range (±30% of current product's price)
        const minPrice = price * 0.7;
        const maxPrice = price * 1.3;

        const response = await axiosInstance.get(`/products`, {
          params: {
            category: category,
            minPrice,
            maxPrice,
            limit: 8, // Fetch more products to filter from
            exclude: id,
          },
        });

        if (response.data && response.data.products) {
          // Filter and sort products by relevance
          const products = response.data.products;
          const similarProducts = products
            .map((product) => ({
              ...product,
              relevanceScore: calculateRelevanceScore(product, {
                breed,
                age,
                price,
              }),
            }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 4); // Take top 4 most relevant products

          setSimilarProducts(similarProducts);
        }
      } catch (err) {
        console.error("Error fetching similar products:", err);
        // Don't fail the whole page load if similar products fail
        setSimilarProducts([]);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError(err.response?.data?.message || "Failed to load product details");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const incrementQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (product && value > 0 && value <= product.quantity) {
      setQuantity(value);
    }
  };

  const toggleWishlist = () => {
    if (!user) {
      toast.error("Please login to add items to your wishlist");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    if (isInWishlist(product._id)) {
      // Pass false to prevent double toast notification
      removeFromWishlist(product._id, false);
    } else {
      addToWishlist(product);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) {
      toast.error("Please login to message the seller");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    if (user._id === product.seller._id) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Starting conversation...");

      // Create a new chat or get existing chat
      const response = await axiosInstance.post("/chat", {
        sellerId: product.seller._id,
        productId: product._id,
      });

      toast.dismiss(loadingToast);
      toast.success("Chat started with seller");

      // Create a custom event to notify the ChatWidget to open with this chat
      const chatEvent = new CustomEvent("openChatWidget", {
        detail: { chatId: response.data._id, product },
      });
      window.dispatchEvent(chatEvent);

      // Optional: Can also navigate to full chat page
      // navigate(`/chat/${response.data._id}`);
    } catch (err) {
      console.error("Error creating chat:", err);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to your cart");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    // Pass false to prevent duplicate toast in CartContext
    addToCart({ ...product, quantity }, quantity, false);
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error("Please login to purchase items");
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    // In a real app, you would navigate to checkout with the selected product
    navigate("/checkout", { state: { products: [{ ...product, quantity }] } });
  };

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        })
        .catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "This product may have been removed or is no longer available."}
          </p>
          <Link
            to="/products"
            className="flex items-center text-orange-600 hover:text-orange-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discountedPrice =
    product.discountPrice ||
    (product.discount
      ? product.price - (product.price * product.discount) / 100
      : null);

  // Use seller's name from profile if available, otherwise use basic name
  const sellerName =
    product.seller?.sellerProfile?.businessName ||
    product.seller?.name ||
    "Unknown Seller";

  // Format reviews count
  const reviewCount = product.reviews?.length || 0;

  // Calculate average rating
  const avgRating =
    product.rating ||
    (product.reviews?.length
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : 0);

  return (
    <div className="bg-gradient-to-b from-orange-50 to-white min-h-screen">
      {/* Farm-themed background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjZmM5ODMwIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PHBhdGggZD0iTTIwIDBoMjB2MjBIMjB6Ii8+PHBhdGggZD0iTTAgMjBoMjB2MjBIMHoiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6Ii8+PC9nPjwvc3ZnPg==')",
          }}
        />
        <div className="absolute top-20 -right-20 w-64 h-64 bg-orange-400/10 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white/50 py-4 border-b border-orange-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-orange-600">
              Home
            </Link>
            <span className="mx-2 text-orange-300">•</span>
            <Link to="/products" className="hover:text-orange-600">
              Products
            </Link>
            <span className="mx-2 text-orange-300">•</span>
            <Link
              to={`/products?category=${product.category}`}
              className="hover:text-orange-600"
            >
              {product.category || "Poultry"}
            </Link>
            <span className="mx-2 text-orange-300">•</span>
            <span className="text-orange-700 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative rounded-lg overflow-hidden border border-orange-100 bg-white mb-4 shadow-sm hover:shadow-md transition-all">
              <div className="aspect-w-1 aspect-h-1">
                <img
                  src={product.images?.[currentImageIndex] || "/1f425.png"}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = "/1f425.png";
                  }}
                />
              </div>

              {/* Image Navigation Arrows */}
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-500 p-2 rounded-full shadow-md hover:shadow-lg transition-all text-white"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-400 to-orange-500 p-2 rounded-full shadow-md hover:shadow-lg transition-all text-white"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                  {product.discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden ${
                      currentImageIndex === index
                        ? "border-amber-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img
                      src={image || "/1f425.png"}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/1f425.png";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons below image */}
            <div className="flex gap-4 mt-4">
              <button
                onClick={toggleWishlist}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                  isInWishlist(product._id)
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isInWishlist(product._id) ? "fill-red-500 text-red-500" : ""
                  }`}
                />
                <span>{isInWishlist(product._id) ? "Saved" : "Save"}</span>
              </button>

              <button
                onClick={handleShareProduct}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 text-sm font-medium"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Product Info */}
          <div>
            {/* Product Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {/* Ratings */}
                <div className="flex items-center">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(avgRating)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    <span className="font-medium">{avgRating.toFixed(1)}</span>
                    <span className="mx-1">•</span>
                    <Link to="#reviews" className="hover:underline">
                      {reviewCount} reviews
                    </Link>
                  </span>
                </div>

                {/* Stock status */}
                <div className="text-sm">
                  {product.quantity > 10 ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      In Stock ({product.quantity} available)
                    </span>
                  ) : product.quantity > 0 ? (
                    <span className="text-orange-500 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Low Stock (Only {product.quantity} left)
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Seller Info */}
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span>Sold by</span>
                <Link
                  to={`/seller/${product.seller?._id}`}
                  className="font-medium text-primary hover:underline mx-1"
                >
                  {sellerName}
                </Link>
                <span className="mx-1">•</span>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{product.location}</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-2">
                {discountedPrice ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900">
                      ₱{discountedPrice.toFixed(2)}
                    </div>
                    <div className="text-lg text-gray-500 line-through">
                      ₱{product.price.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-red-600 ml-2">
                      {product.discount}% OFF
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    ₱{product.price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="mb-8">
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-200">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="px-4 py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.quantity}
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="w-16 text-center border-0 focus:ring-0 focus:outline-none bg-transparent text-orange-800 font-bold text-lg"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.quantity}
                    className="px-4 py-3 text-orange-600 hover:text-orange-700 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                  {product.quantity} available
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors font-medium"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  Buy Now
                </button>
              </div>

              {/* Secure Transaction */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure transaction • Money back guarantee</span>
              </div>
            </div>

            {/* Quick Details */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-orange-100 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                <Egg className="h-4 w-4 mr-2 text-orange-500" />
                Quick Details
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.breed && (
                  <div>
                    <dt className="text-gray-500">Breed:</dt>
                    <dd className="font-medium text-gray-900">
                      {product.breed}
                    </dd>
                  </div>
                )}
                {product.age > 0 && (
                  <div>
                    <dt className="text-gray-500">Age:</dt>
                    <dd className="font-medium text-gray-900">
                      {product.age} {product.age === 1 ? "month" : "months"}
                    </dd>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <dt className="text-gray-500">Weight:</dt>
                    <dd className="font-medium text-gray-900">
                      {product.weight}
                    </dd>
                  </div>
                )}
                {product.specifications?.slice(0, 1).map((spec) => (
                  <div key={spec.name}>
                    <dt className="text-gray-500">{spec.name}:</dt>
                    <dd className="font-medium text-gray-900">{spec.value}</dd>
                  </div>
                ))}
              </dl>
              {product.specifications?.length > 1 && (
                <button
                  onClick={() => setActiveTab("specifications")}
                  className="text-orange-600 text-sm font-medium mt-2 flex items-center hover:text-orange-700"
                >
                  <span>See all specifications</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-100">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-gray-900">{sellerName}</h3>
                    {product.seller?.verified && (
                      <CheckCircle className="h-4 w-4 ml-1 text-green-500 fill-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Seller</p>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500 ml-1">
                        {product.location || "Location not specified"}
                      </span>
                    </div>
                    <div className="flex items-center ml-3">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500 ml-1">
                        Member since{" "}
                        {product.seller?.createdAt
                          ? new Date(
                              product.seller.createdAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => navigate(`/seller/${product.seller?._id}`)}
                >
                  View Store
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={handleMessageSeller}
                >
                  Contact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-orange-200 hover:bg-red-50"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs - Description, Specifications, Reviews */}
        <div className="mt-12">
          <div className="border-b border-orange-100">
            <nav className="flex space-x-8" aria-label="Product details tabs">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "description"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "specifications"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "shipping"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Shipping
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Reviews ({reviewCount})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="py-6">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {activeTab === "specifications" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Product Specifications
                </h3>
                <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      {product.specifications?.map((spec) => (
                        <tr key={spec.name}>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50 w-1/3">
                            {spec.name}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {spec.value}
                          </td>
                        </tr>
                      ))}
                      {product.breed && (
                        <tr>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50">
                            Breed
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {product.breed}
                          </td>
                        </tr>
                      )}
                      {product.age && (
                        <tr>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50">
                            Age
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {product.age}
                          </td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50">
                            Weight
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {product.weight}
                          </td>
                        </tr>
                      )}
                      {product.location && (
                        <tr>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900 bg-gray-50">
                            Location
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {product.location}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "shipping" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Shipping Information
                </h3>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-start gap-6">
                    <div className="rounded-full p-3 bg-blue-100">
                      <Truck className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-gray-700 mb-4">
                        {product.shippingInfo ||
                          "Shipping information not provided by seller."}
                      </p>

                      <h4 className="font-medium text-gray-900 mb-2">
                        Delivery Details
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Packaging:</span>
                            <span className="text-gray-700">
                              {" "}
                              Special ventilated boxes for safe transport
                            </span>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Delivery Time:</span>
                            <span className="text-gray-700">
                              {" "}
                              1-2 business days
                            </span>
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <span className="font-medium">Tracking:</span>
                            <span className="text-gray-700">
                              {" "}
                              Real-time tracking provided via email and SMS
                            </span>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  <button className="text-sm font-medium text-white bg-primary px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                    Write a Review
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {avgRating.toFixed(1)}
                      </div>
                      <div className="flex mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(avgRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reviewCount} reviews
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      {/* Generate rating bars based on actual data if available */}
                      {[5, 4, 3, 2, 1].map((starCount) => {
                        const reviewsWithThisRating =
                          product.reviews?.filter(
                            (r) => Math.round(r.rating) === starCount
                          ) || [];
                        const percentage =
                          reviewCount > 0
                            ? (reviewsWithThisRating.length / reviewCount) * 100
                            : 0;

                        return (
                          <div key={starCount} className="flex items-center">
                            <div className="w-24 text-sm text-gray-600">
                              {starCount} stars
                            </div>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="bg-yellow-400 h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-sm text-gray-600 text-right">
                              {percentage.toFixed(0)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Display actual reviews */}
                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {product.reviews.map((review, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              {review.userName?.charAt(0) || "U"}
                            </div>
                            <h4 className="font-medium ml-2">
                              {review.userName || "Anonymous"}
                            </h4>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(review.rating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(review.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Similar Products
              </h2>
              <Link
                to="/products"
                className="ml-auto text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group rounded-lg overflow-hidden border border-orange-100 bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-orange-50 relative">
                    <img
                      src={product.images?.[0] || "/1f425.png"}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/1f425.png";
                      }}
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors mb-1 truncate">
                      {product.name}
                    </h3>
                    {product.breed && (
                      <p className="text-sm text-gray-500 mb-2">
                        Breed: {product.breed}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-orange-600">
                        ${product.price?.toFixed(2)}
                      </div>
                      {product.rating > 0 && (
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm text-gray-600 ml-1">
                            {product.rating?.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add the Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        productId={product._id}
        productName={product.name}
      />
    </div>
  );
};

// Add the relevance score calculation function
const calculateRelevanceScore = (product, reference) => {
  let score = 0;

  // Same breed bonus
  if (product.breed === reference.breed) {
    score += 3;
  }

  // Similar age bonus (within 2 months)
  if (Math.abs(product.age - reference.age) <= 2) {
    score += 2;
  }

  // Price similarity bonus (closer price = higher score)
  const priceDiffPercentage =
    Math.abs(product.price - reference.price) / reference.price;
  score += (1 - priceDiffPercentage) * 2; // Max 2 points for price similarity

  // Add some randomness to ensure variety (0-1 point)
  score += Math.random();

  return score;
};

export default ProductDetailPage;
