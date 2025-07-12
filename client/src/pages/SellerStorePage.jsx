import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { apiGetSellerProfile, apiGetSellerProducts } from "@/api/seller";
import toast from "react-hot-toast";

const SellerStorePage = () => {
  const { sellerId } = useParams();
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
      let sellerData = null;
      let productsData = [];
      let notFound = false;
      try {
        [sellerData, productsData] = await Promise.all([
          apiGetSellerProfile(sellerId),
          apiGetSellerProducts(sellerId),
        ]);
      } catch (err) {
        // Only show 'Store Not Found' if backend returns 404
        if (err?.response?.status === 404) {
          notFound = true;
        } else {
          // If seller exists but has no profile/products, use minimal fallback
          sellerData = {
            _id: sellerId,
            name: "Seller",
            sellerProfile: null,
            createdAt: new Date(),
          };
          productsData = [];
        }
      }
      if (notFound) {
        setError("notfound");
        setSeller(null);
        setProducts([]);
        return;
      }
      setSeller(sellerData);
      setProducts(productsData || []);
    } catch (err) {
      console.error("Error fetching seller data:", err);
      setError("Failed to load store information");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1, true);
  };

  const handleToggleWishlist = (product) => {
    if (isInWishlist(product._id)) {
      removeFromWishlist(product._id, false);
    } else {
      addToWishlist(product);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      toast.error("Please login to contact the seller");
      return;
    }

    // Redirect to chat with seller
    const chatUrl =
      user.role === "buyer"
        ? `/buyer-dashboard/chat?sellerId=${sellerId}`
        : `/seller/messages?sellerId=${sellerId}`;

    window.location.href = chatUrl;
  };

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (error === "notfound") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Store Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The store you're looking for doesn't exist or is no longer
              available.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default cover image and layout for every seller
  const sellerName =
    seller?.sellerProfile?.businessName || seller?.name || `Seller`;
  const avgRating = seller?.sellerProfile?.rating || 0;
  const totalReviews = seller?.sellerProfile?.reviewCount || 0;
  const description =
    seller?.sellerProfile?.description || "No description yet.";
  const address = seller?.sellerProfile?.address
    ? typeof seller.sellerProfile.address === "string"
      ? seller.sellerProfile.address
      : `${seller.sellerProfile.address.city || ""}, ${
          seller.sellerProfile.address.state || ""
        }, ${seller.sellerProfile.address.country || ""}`
          .replace(/^,\s*|,\s*$/g, "")
          .replace(/,\s*,/g, ",") || "Location not specified"
    : "Location not specified";
  const memberSince = seller?.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Default Cover */}
      <div className="w-full h-48 bg-gradient-to-r from-orange-400 to-yellow-300 flex items-end">
        <div className="max-w-7xl mx-auto w-full px-4 pb-4">
          <div className="flex items-end gap-4">
            <div className="p-4 rounded-full bg-white shadow-lg border-4 border-orange-400">
              <Store className="h-16 w-16 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                {sellerName}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="bg-white/80 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Member since {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Seller Profile Sidebar */}
          <aside className="w-full lg:w-80 bg-white rounded-xl border border-orange-100 shadow-lg p-6 flex flex-col items-center mb-8 lg:mb-0">
            <div className="p-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg mb-4">
              <Store className="h-12 w-12" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {sellerName}
            </h2>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= avgRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-gray-600 text-sm">
                {avgRating.toFixed(1)} ({totalReviews} reviews)
              </span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1 text-orange-500" />
              <span>{address}</span>
            </div>
            <p className="text-gray-700 text-center mb-4">{description}</p>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white mb-2">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Seller
            </Button>
            <div className="flex items-center justify-center text-xs text-gray-500">
              <Shield className="h-3 w-3 mr-1" />
              <span>Secure transactions guaranteed</span>
            </div>
          </aside>

          {/* Products Section */}
          <main className="flex-1">
            <div className="bg-white rounded-xl border border-orange-100 shadow-sm">
              <div className="p-6 border-b border-orange-100">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Products
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                  available
                </p>
              </div>
              <div className="p-6">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="group rounded-lg overflow-hidden border border-orange-100 bg-white shadow-sm hover:shadow-md transition-all"
                      >
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
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link to={`/products/${product._id}`}>
                            <h3 className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors mb-1 line-clamp-1">
                              {product.name}
                            </h3>
                          </Link>
                          {product.breed && (
                            <p className="text-sm text-gray-500 mb-2">
                              Breed: {product.breed}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-orange-600">
                              ₱{product.price.toFixed(2)}
                            </div>
                            <Button
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No products found
                    </h3>
                    <p className="text-gray-600">
                      This store hasn't added any products yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
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
            <div>
              <Link
                to={`/products/${product._id}`}
                className="font-medium text-gray-900 hover:text-orange-600 transition-colors"
              >
                {product.name}
              </Link>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="font-bold text-orange-600">
                  ₱{product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.quantity}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAddToCart}
                disabled={product.quantity < 1}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
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
            ₱{product.price.toFixed(2)}
          </div>
          <Button
            size="sm"
            onClick={onAddToCart}
            disabled={product.quantity < 1}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SellerStorePage;
