import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Store,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Package,
  Users,
  MessageCircle,
  Calendar,
  Shield,
  Award,
  ArrowLeft,
  Grid,
  List,
  Filter,
  Search,
  Heart,
  ShoppingCart,
  Phone,
  Mail,
  Badge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { apiGetSellerProfile, apiGetSellerProducts } from "@/api/seller";
import { axiosInstance } from "@/contexts/axios";
import toast from "react-hot-toast";

const SellerStorePage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, addToWishlist, isInWishlist, removeFromWishlist } =
    useCart();

  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchSellerData();
    // eslint-disable-next-line
  }, [sellerId]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch seller profile and products separately for better error handling
      let sellerData = null;
      let productsData = [];
      
      // Try to fetch seller profile first
      try {
        sellerData = await apiGetSellerProfile(sellerId);
      } catch (profileErr) {
        console.error("Seller profile error:", profileErr?.response?.status, profileErr?.response?.data);
        // Create fallback seller data but with a more generic name if the seller might exist
        sellerData = {
          _id: sellerId,
          name: "Seller Store",
          sellerProfile: {
            businessName: `Store ${sellerId.slice(-6)}`,
            description: "Welcome to our store! We're just getting started and adding more products soon.",
            rating: 0,
            reviewCount: 0,
            address: "Location not specified"
          },
          createdAt: new Date(),
        };
      }
      
      // Try to fetch products separately (even if profile fails, products might exist)
      try {
        productsData = await apiGetSellerProducts(sellerId);
        
        // If we got products but no real seller profile, this is likely a real seller
        if (productsData && productsData.length > 0 && sellerData.name === "Seller Store") {
          sellerData.sellerProfile.businessName = `Seller's Store`;
          sellerData.sellerProfile.description = "Check out our amazing products below!";
        }
      } catch (productsErr) {
        console.error("Products fetch error:", productsErr?.response?.status, productsErr?.response?.data);
        // Products will remain empty array
        productsData = [];
      }
      
      setSeller(sellerData);
      setProducts(productsData || []);
    } catch (err) {
      console.error("Error fetching seller data:", err);
      // Even if there's an error, show the store with default data
      setSeller({
        _id: sellerId,
        name: "Seller Store",
        sellerProfile: {
          businessName: `Store ${sellerId.slice(-6)}`,
          description: "Welcome to our store! We're just getting started.",
          rating: 0,
          reviewCount: 0,
          address: "Location not specified"
        },
        createdAt: new Date(),
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    addToCart(product, 1, true);
  };

  const handleToggleWishlist = (product) => {
    if (!user) {
      toast.error("Please login to save items to wishlist");
      return;
    }
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id, false);
    } else {
      addToWishlist(product);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      toast.error("Please login to contact the seller");
      return;
    }

    if (user._id === sellerId) {
      toast.error("You cannot message yourself");
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading("Starting conversation...");

      // Create a new chat or get existing chat with the seller
      const response = await axiosInstance.post("/chat", {
        sellerId: sellerId,
      });

      toast.dismiss(loadingToast);
      toast.success("Chat started with seller");

      // Create a custom event to notify the ChatWidget to open with this chat
      const chatEvent = new CustomEvent("openChatWidget", {
        detail: { chatId: response.data._id },
      });
      window.dispatchEvent(chatEvent);

    } catch (err) {
      console.error("Error creating chat:", err);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  // Get unique categories from products
  const categories = [...new Set(products.map(product => product.category))].filter(Boolean);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.breed?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
                    style={{ animationDelay: `${i * 300}ms` }}
                  />
                ))}
              </div>
              <p className="text-orange-600 mt-4 text-sm">Loading store...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Store information with default values
  const storeInfo = {
    name: seller?.sellerProfile?.businessName || seller?.name || `Store`,
    rating: seller?.sellerProfile?.rating || 0,
    reviewCount: seller?.sellerProfile?.reviewCount || 0,
    description: seller?.sellerProfile?.description || "Welcome to our store! We offer quality products with excellent service.",
    address: seller?.sellerProfile?.address
      ? typeof seller.sellerProfile.address === "string"
        ? seller.sellerProfile.address
        : `${seller.sellerProfile.address.city || ""}, ${
            seller.sellerProfile.address.state || ""
          }, ${seller.sellerProfile.address.country || ""}`
            .replace(/^,\s*|,\s*$/g, "")
            .replace(/,\s*,/g, ",") || "Location not specified"
      : "Location not specified",
    memberSince: seller?.createdAt
      ? new Date(seller.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        })
      : "N/A"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Store Header with Cover */}
      <div className="w-full h-48 bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 flex items-end relative">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto w-full px-4 pb-4 relative z-10">
          <div className="flex items-end gap-4">
            <div className="p-4 rounded-full bg-white shadow-lg border-4 border-white">
              <Store className="h-16 w-16 text-orange-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-1">
                {storeInfo.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="bg-white/90 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Member since {storeInfo.memberSince}
                </span>
                <div className="flex items-center gap-1 bg-white/90 px-3 py-1 rounded-full">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-xs font-semibold text-gray-700">
                    {storeInfo.rating.toFixed(1)} ({storeInfo.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleContactSeller}
              className="bg-white text-orange-600 hover:bg-orange-50 border-2 border-white shadow-lg"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Seller Info Sidebar */}
          <aside className="w-full lg:w-80 space-y-6">
            {/* Store Info Card */}
            <Card className="border-orange-100 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600 w-fit mx-auto mb-3">
                    <Store className="h-8 w-8" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    {storeInfo.name}
                  </h2>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= storeInfo.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-gray-600 text-sm ml-1">
                      ({storeInfo.reviewCount})
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{storeInfo.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Joined {storeInfo.memberSince}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">
                      {products.length} product{products.length !== 1 ? "s" : ""} available
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {storeInfo.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Secure transactions guaranteed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories Card */}
            {categories.length > 0 && (
              <Card className="border-orange-100 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-orange-500" />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setCategoryFilter("all")}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        categoryFilter === "all"
                          ? "bg-orange-100 text-orange-700 font-medium"
                          : "text-gray-600 hover:bg-orange-50"
                      }`}
                    >
                      All Products ({products.length})
                    </button>
                    {categories.map((category) => {
                      const count = products.filter(p => p.category === category).length;
                      return (
                        <button
                          key={category}
                          onClick={() => setCategoryFilter(category)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            categoryFilter === category
                              ? "bg-orange-100 text-orange-700 font-medium"
                              : "text-gray-600 hover:bg-orange-50"
                          }`}
                        >
                          {category} ({count})
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Products Section */}
          <main className="flex-1">
            <Card className="border-orange-100 shadow-sm">
              <CardContent className="p-6">
                {/* Search and Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-2 ${
                          viewMode === "grid"
                            ? "bg-orange-100 text-orange-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 ${
                          viewMode === "list"
                            ? "bg-orange-100 text-orange-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Products Grid/List */}
                {filteredProducts.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    }
                  >
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        viewMode={viewMode}
                        onAddToCart={() => handleAddToCart(product)}
                        onToggleWishlist={() => handleToggleWishlist(product)}
                        isInWishlist={isInWishlist(product._id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || categoryFilter !== "all" 
                        ? "No products found" 
                        : "Store Coming Soon"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || categoryFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "This store is setting up and will have amazing products available soon. Check back later!"}
                    </p>
                    {(searchTerm || categoryFilter !== "all") ? (
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setCategoryFilter("all");
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          onClick={handleContactSeller}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Contact Seller
                        </Button>
                        <Button
                          onClick={() => navigate("/products")}
                          variant="outline"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          Browse Other Products
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Product Reviews Section */}
            {products.some(p => p.reviews && p.reviews.length > 0) && (
              <Card className="border-orange-100 shadow-sm mt-6">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-500" />
                    Recent Product Reviews
                  </h2>
                  <div className="grid gap-4">
                    {products
                      .filter(p => p.reviews && p.reviews.length > 0)
                      .slice(0, 3) // Show only 3 most recent
                      .map(product => {
                        const recentReviews = product.reviews
                          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                          .slice(0, 2); // Show 2 most recent per product
                        
                        return recentReviews.map((review, index) => (
                          <div key={`${product._id}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                  {review.userName?.charAt(0) || review.user?.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {review.userName || review.user?.name || "Anonymous"}
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {new Date(review.createdAt || review.date).toLocaleDateString()}
                                  </p>
                                </div>
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
                            <p className="text-gray-700 mb-2">{review.comment}</p>
                            <Link 
                              to={`/products/${product._id}`}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              {product.name}
                            </Link>
                          </div>
                        ));
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({
  product,
  viewMode,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
}) => {
  if (viewMode === "list") {
    return (
      <div className="flex gap-4 p-4 border border-orange-100 rounded-lg hover:shadow-md transition-shadow">
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
          <img
            src={product.images?.[0] || "/1f425.png"}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/1f425.png";
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link
                to={`/products/${product._id}`}
                className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
              >
                {product.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description}
              </p>
              {product.breed && (
                <p className="text-xs text-gray-500 mt-1">
                  Breed: {product.breed}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-orange-600">
                  ₱{product.price?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.quantity || 0}
                </span>
                {product.category && (
                  <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                    {product.category}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={onToggleWishlist}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={onAddToCart}
                disabled={product.quantity < 1}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg overflow-hidden border border-orange-100 bg-white shadow-sm hover:shadow-md transition-all">
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-square bg-orange-50 relative overflow-hidden">
          <img
            src={product.images?.[0] || "/1f425.png"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = "/1f425.png";
            }}
          />
          {product.quantity === 0 && (
            <div className="absolute top-2 left-2 bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
              Sold Out
            </div>
          )}
          {product.category && (
            <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded">
              {product.category}
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist();
            }}
            className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
          >
            <Heart className={`h-4 w-4 text-orange-600 ${isInWishlist ? 'fill-current' : ''}`} />
          </button>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product._id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors mb-1 line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {product.breed && (
          <p className="text-sm text-gray-500 mb-2">Breed: {product.breed}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="font-bold text-orange-600">
            ₱{product.price?.toFixed(2)}
          </div>
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.quantity < 1}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerStorePage;
