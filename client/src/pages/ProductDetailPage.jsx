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
      removeFromWishlist(product._id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
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

    addToCart({ ...product, quantity });
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
            className="flex items-center text-primary hover:text-primary/80 transition-colors"
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
    <div className="bg-white">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">•</span>
            <Link to="/products" className="hover:text-gray-900">
              Products
            </Link>
            <span className="mx-2">•</span>
            <Link
              to={`/products?category=${product.category}`}
              className="hover:text-gray-900"
            >
              {product.category || "Poultry"}
            </Link>
            <span className="mx-2">•</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white mb-4">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Discount badge */}
              {product.discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
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
                      ${discountedPrice.toFixed(2)}
                    </div>
                    <div className="text-lg text-gray-500 line-through">
                      ${product.price.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-red-600 ml-2">
                      {product.discount}% OFF
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-gray-900">
                    ${product.price.toFixed(2)}
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
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
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
                    className="w-14 text-center border-0 focus:ring-0"
                  />
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.quantity}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-500">
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
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Quick Details</h3>
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
                  className="text-primary text-sm font-medium mt-2 flex items-center hover:underline"
                >
                  <span>See all specifications</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>

            {/* Seller Card */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{sellerName}</h3>
                    {product.seller?.sellerProfile?.rating && (
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                        <span>{product.seller.sellerProfile.rating}</span>
                      </div>
                    )}
                  </div>
                  {product.seller?.createdAt && (
                    <p className="text-sm text-gray-500 mb-3">
                      Member since{" "}
                      {new Date(product.seller.createdAt).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "long" }
                      )}
                      {product.seller?.sellerProfile?.totalSales && (
                        <>
                          <span className="mx-2">•</span>
                          {product.seller.sellerProfile.totalSales}+ sales
                        </>
                      )}
                    </p>
                  )}
                  {(product.seller?.sellerProfile?.responseRate ||
                    product.seller?.sellerProfile?.responseTime) && (
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                      {product.seller?.sellerProfile?.responseRate && (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          <span>
                            {product.seller.sellerProfile.responseRate}%
                            Response Rate
                          </span>
                        </div>
                      )}
                      {product.seller?.sellerProfile?.responseTime && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-green-500 mr-1" />
                          <span>
                            Responds {product.seller.sellerProfile.responseTime}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {product.seller?._id && product.seller?._id !== user?._id && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleMessageSeller}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Contact Seller
                      </button>
                      <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                      >
                        <Flag className="h-4 w-4" />
                        Report Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs - Description, Specifications, Reviews */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8" aria-label="Product details tabs">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "description"
                    ? "border-b-2 border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "specifications"
                    ? "border-b-2 border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "shipping"
                    ? "border-b-2 border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Shipping
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-4 px-1 text-sm font-medium ${
                  activeTab === "reviews"
                    ? "border-b-2 border-primary text-primary"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Similar Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200"
                >
                  <div className="aspect-square bg-amber-50 relative">
                    <img
                      src={product.images?.[0] || "/1f425.png"}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = "/1f425.png";
                      }}
                    />
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {product.discount}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors mb-1 truncate">
                      {product.name}
                    </h3>
                    {product.breed && (
                      <p className="text-sm text-gray-500 mb-2">
                        Breed: {product.breed}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-600">
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
        reportedUserId={product?.seller?._id}
        reporterRole="buyer"
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
