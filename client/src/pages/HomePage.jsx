import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetProducts } from "@/api/products";
import { useCart } from "@/contexts/CartContext";
import {
  ShoppingCart,
  Store,
  Star,
  Heart,
  Eye,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sun,
  CloudRain,
  Bird,
  Egg,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const HomePage = () => {
  const { user } = useAuth();
  const { addToCart, addToWishlist, isInWishlist } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState({
    featured: true,
    newArrivals: true,
    categories: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch featured products (highest rated)
      const featuredResponse = await apiGetProducts({
        sort: "-rating",
        limit: 4,
      });
      setFeaturedProducts(featuredResponse.products || []);
      setLoading((prev) => ({ ...prev, featured: false }));

      // Fetch new arrivals
      const newArrivalsResponse = await apiGetProducts({
        sort: "-createdAt",
        limit: 4,
      });
      setNewArrivals(newArrivalsResponse.products || []);
      setLoading((prev) => ({ ...prev, newArrivals: false }));

      // Get category counts
      const allProductsResponse = await apiGetProducts({ limit: 1000 });
      const products = allProductsResponse.products || [];

      const categories = products.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = { count: 0, name: category };
        }
        acc[category].count++;
        return acc;
      }, {});

      setTopCategories(Object.values(categories));
      setLoading((prev) => ({ ...prev, categories: false }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load some content");
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    await addToCart(product);
    toast.success("Added to cart!");
  };

  const handleAddToWishlist = async (product) => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    await addToWishlist(product);
    toast.success("Added to wishlist!");
  };

  if (loading.featured && loading.newArrivals && loading.categories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero Section with Farm Theme */}
      <section className="relative bg-gradient-to-b from-amber-50 to-white pt-8 pb-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/farm-pattern.svg')] opacity-5" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>
        <Sun className="absolute top-10 right-10 h-16 w-16 text-amber-300 animate-pulse opacity-50" />
        <CloudRain className="absolute top-20 right-32 h-8 w-8 text-blue-300 animate-float opacity-30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="relative z-10 animate-fade-in">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-sm font-medium mb-6 animate-float">
                <Bird className="h-4 w-4 mr-2" />
                Welcome to the Farm
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Trusted <br />
                <span className="text-amber-600">Poultry Partner</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                From farm fresh eggs to heritage breed chickens. Find everything
                you need for your backyard flock.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Browse Products
                </Link>
                {!user && (
                  <Link
                    to="/register/seller"
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-6">
                {["Verified Sellers", "Secure Payments", "24/7 Support"].map(
                  (feature) => (
                    <div
                      key={feature}
                      className="flex items-center text-gray-500 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 text-primary mr-1" />
                      {feature}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="relative animate-fade-in-delayed">
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-white shadow-2xl">
                {featuredProducts[0]?.images?.[0] && (
                  <img
                    src={featuredProducts[0].images[0]}
                    alt="Featured Product"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {featuredProducts[0]?.price && (
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
                    <p className="text-lg font-bold text-primary">
                      ${featuredProducts[0].price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Starting Price</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories as Farm Areas */}
      <section className="py-16 bg-gradient-to-b from-white to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Explore the Farm
            </h2>
            <p className="mt-2 text-gray-600">
              Visit different areas of our virtual farm
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {topCategories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name}`}
                className="group relative"
              >
                <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 hover:shadow-md transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getCategoryIcon(category.name)}
                    </div>
                    <h3 className="font-medium text-gray-900 capitalize group-hover:text-amber-700 transition-colors">
                      {getFriendlyName(category.name)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.count}{" "}
                      {category.count === 1 ? "friend" : "friends"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products as "Today's Picks" */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Today's Farm Picks
              </h2>
              <p className="mt-2 text-gray-600">
                Hand-selected by our experienced farmers
              </p>
            </div>
            <Link
              to="/products"
              className="text-amber-600 font-medium flex items-center hover:text-amber-700"
            >
              Visit Coop <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <FarmProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                isInWishlist={isInWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">New Arrivals</h2>
              <p className="mt-2 text-gray-600">
                Latest additions to our marketplace
              </p>
            </div>
            <Link
              to="/products?sort=newest"
              className="text-primary font-medium flex items-center hover:underline"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={handleAddToWishlist}
                isInWishlist={isInWishlist}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Poultry Business?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
              Join thousands of buyers and sellers in our growing marketplace.
              Create your account today and take your poultry business to the
              next level.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to={user ? "/products" : "/register"}
                className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-primary font-medium hover:bg-gray-100 transition-colors"
              >
                {user ? "Browse Products" : "Sign Up Now"}
              </Link>
              <Link
                to="/contact-us"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-dark text-white font-medium border border-white/30 hover:bg-primary-dark/90 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper function to get category icons
const getCategoryIcon = (category) => {
  switch (category.toLowerCase()) {
    case "chicken":
      return <Bird className="h-10 w-10 text-amber-600" />;
    case "eggs":
      return <Egg className="h-10 w-10 text-amber-600" />;
    case "feed":
      return <Store className="h-10 w-10 text-amber-600" />;
    default:
      return <Store className="h-10 w-10 text-amber-600" />;
  }
};

// Helper function to get friendly category names
const getFriendlyName = (category) => {
  const names = {
    chicken: "Chicken Coop",
    duck: "Duck Pond",
    turkey: "Turkey Run",
    quail: "Quail Corner",
    other: "Farm Store",
  };
  return names[category.toLowerCase()] || category;
};

// Updated Product Card with Farm Theme
const FarmProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  isInWishlist,
}) => {
  const { _id, name, price, images, rating, seller, quantity, age, breed } =
    product;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-amber-100">
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Main Content */}
      <div className="relative">
        <Link to={`/products/${_id}`}>
          <div className="aspect-square overflow-hidden bg-amber-50 flex items-center justify-center">
            <img
              src={images?.[0] || "/1f425.png"}
              alt={name}
              className="w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "/1f425.png";
              }}
            />
          </div>
        </Link>

        {/* Quick Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onAddToWishlist(product)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-amber-50 transition-colors"
            title="Add to Wishlist"
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist?.(product._id)
                  ? "fill-red-500 text-red-500"
                  : "text-amber-600"
              }`}
            />
          </button>
          <Link to={`/products/${_id}`}>
            <button
              className="p-2 bg-white rounded-full shadow-md hover:bg-amber-50 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4 text-amber-600" />
            </button>
          </Link>
        </div>

        {/* Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {quantity === 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
              Sold Out
            </span>
          )}
          {age > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
              {age} {age === 1 ? "month" : "months"} old
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="relative p-4">
        <Link to={`/products/${_id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
            {name}
          </h3>
        </Link>

        {breed && <p className="text-sm text-gray-500 mt-1">Breed: {breed}</p>}

        {seller && (
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <Store className="h-3 w-3 mr-1" />
            {seller.name ||
              seller.sellerProfile?.businessName ||
              "Unknown Farm"}
          </p>
        )}

        <div className="flex items-center mt-2">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <span className="text-sm text-gray-600 ml-1">
            {rating?.toFixed(1) || "New"}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="font-bold text-amber-600">${price?.toFixed(2)}</span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={quantity === 0}
            className={`p-2 rounded-full ${
              quantity === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-amber-100 text-amber-600 hover:bg-amber-200"
            } transition-colors`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  isInWishlist,
}) => {
  const { _id, name, price, images, rating, seller, quantity } = product;

  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100">
      <div className="relative">
        <Link to={`/products/${_id}`}>
          <div className="aspect-square overflow-hidden bg-amber-50 flex items-center justify-center">
            <img
              src={images?.[0] || "/1f425.png"}
              alt={name}
              className="w-24 h-24 object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "/1f425.png";
              }}
            />
          </div>
        </Link>

        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToWishlist(product)}
            className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${
                isInWishlist(product._id) ? "fill-red-500 text-red-500" : ""
              }`}
            />
          </button>
          <Link to={`/products/${_id}`}>
            <button className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors">
              <Eye className="h-4 w-4" />
            </button>
          </Link>
        </div>

        {quantity === 0 && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-4">
        <Link to={`/products/${_id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        {seller && (
          <p className="text-sm text-gray-500 mb-2">
            by{" "}
            {seller.name ||
              seller.sellerProfile?.businessName ||
              "Unknown Seller"}
          </p>
        )}

        <div className="flex items-center mb-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm text-gray-600 ml-1">
            {rating?.toFixed(1) || "New"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">${price?.toFixed(2)}</span>
          <button
            onClick={() => onAddToCart(product)}
            disabled={quantity === 0}
            className={`p-2 rounded-full ${
              quantity === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
            } transition-colors`}
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
