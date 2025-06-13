import React, { useState, useEffect, useRef } from "react";
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
  Mail,
  Package,
  Truck,
  Award,
  Shield,
  Clock,
  ChevronRight,
  MessageCircle,
  Leaf,
  Calendar,
  Users,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

const HomePage = () => {
  const { user } = useAuth();
  const { addToCart, addToWishlist, isInWishlist } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Backyard Farmer",
      content:
        "The quality of chickens I purchased exceeded my expectations. My backyard farm has never been more productive!",
      avatar: "/avatars/avatar-1.jpg",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Poultry Enthusiast",
      content:
        "I've been buying from this marketplace for over a year. The seller support and product quality are consistently excellent.",
      avatar: "/avatars/avatar-2.jpg",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Small Business Owner",
      content:
        "As someone who runs a small farm-to-table restaurant, I rely on quality poultry. This platform has been a game-changer for my business.",
      avatar: "/avatars/avatar-3.jpg",
    },
  ]);
  const [loading, setLoading] = useState({
    featured: true,
    newArrivals: true,
    categories: true,
  });

  const heroRef = useRef(null);
  const featuredRef = useRef(null);
  const categoriesRef = useRef(null);
  const newArrivalsRef = useRef(null);

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
    // Pass false to prevent duplicate toast from CartContext
    await addToCart(product, 1, false);
    toast.success("Added to cart!");
  };

  const handleAddToWishlist = async (product) => {
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    // Pass false to prevent duplicate toast from CartContext
    await addToWishlist(product, false);
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
      {/* Hero Section - Modern Farm Theme */}
      <section
        ref={heroRef}
        className="relative bg-gradient-to-br from-[#fff5e9] via-[#fffaf2] to-white pt-12 pb-20 md:py-24 overflow-hidden"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/farm-pattern.svg')] opacity-10" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#fcba6d]/10 rounded-full blur-[80px] animate-pulse-slow" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#e8f4ea]/30 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* Animated icons */}
        <Sun className="absolute top-12 right-[10%] h-16 w-16 text-[#fcba6d] animate-pulse opacity-60" />
        <CloudRain className="absolute top-24 right-[25%] h-8 w-8 text-[#ffd4a3] animate-float opacity-40" />
        <Bird className="absolute top-[40%] right-[15%] h-6 w-6 text-[#cd8539] animate-bounce-slow opacity-50" />
        <Leaf className="absolute bottom-[20%] left-[10%] h-8 w-8 text-[#8fbc8f]/60 animate-float opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Hero content */}
            <div className="relative z-10 animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#fff0dd] text-[#cd8539] text-sm font-medium mb-6 shadow-sm animate-float">
                <Bird className="h-4 w-4 mr-2" />
                <span className="relative">Welcome to the Farm</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Trusted <br />
                <span className="text-[#fcba6d] relative inline-block">
                  Poultry Partner
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-2 text-[#fcba6d]/30"
                    viewBox="0 0 100 15"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,5 Q25,0 50,5 T100,5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-lg text-gray-600 mb-8 max-w-lg">
                From farm fresh eggs to heritage breed chickens. Find everything
                you need for your backyard flock with our premium selection.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  to="/products"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-[#fcba6d] text-white font-medium hover:bg-[#eead5f] transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Browse Products
                </Link>
                {!user && (
                  <Link
                    to="/register/seller"
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-[#fcba6d] font-medium hover:bg-[#fff5e9] transition-all duration-300 shadow-sm hover:shadow-md border border-[#fcba6d] transform hover:-translate-y-1"
                  >
                    <Store className="mr-2 h-5 w-5" />
                    Become a Seller
                  </Link>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                {[
                  { icon: Shield, text: "Verified Sellers" },
                  { icon: CheckCircle, text: "Secure Payments" },
                  { icon: Clock, text: "24/7 Support" },
                ].map((feature) => (
                  <div
                    key={feature.text}
                    className="flex items-center text-gray-600 text-sm bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-sm"
                  >
                    <feature.icon className="h-4 w-4 text-[#fcba6d] mr-2 flex-shrink-0" />
                    {feature.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero image */}
            <div className="relative animate-fade-in-delayed">
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-gradient-to-br from-[#fff8ef] to-white shadow-2xl border border-[#ffecd4] group">
                {featuredProducts[0]?.images?.[0] ? (
                  <img
                    src={featuredProducts[0].images[0]}
                    alt="Featured Product"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Egg className="h-24 w-24 text-[#fcba6d]/50" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#fcba6d]/30 to-transparent" />

                {featuredProducts[0] && (
                  <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-[#ffecd4]">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {featuredProducts[0].name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-[#fcba6d]">
                          ${featuredProducts[0].price?.toFixed(2)}
                        </p>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-gray-600">
                            {featuredProducts[0].rating?.toFixed(1) || "New"}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/products/${featuredProducts[0]._id}`}
                        className="mt-2 text-[#cd8539] text-sm font-medium flex items-center hover:underline"
                      >
                        View Details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Features Section - NEW */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Truck,
                title: "Free Shipping",
                description: "On orders over $50",
                color: "bg-[#f7f0e6]",
                iconColor: "text-[#cd8539]",
              },
              {
                icon: Shield,
                title: "Quality Guarantee",
                description: "100% healthy poultry",
                color: "bg-[#e8f4ea]",
                iconColor: "text-[#5c9d6f]",
              },
              {
                icon: MessageCircle,
                title: "Expert Support",
                description: "Dedicated assistance",
                color: "bg-[#eef4fb]",
                iconColor: "text-[#4a7aaf]",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`${feature.color} rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex items-start gap-4`}
              >
                <div
                  className={`p-3 rounded-full ${feature.color} shadow-inner`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories as Farm Areas - REDESIGNED */}
      <section
        ref={categoriesRef}
        className="py-16 bg-gradient-to-b from-white to-[#fff5e9]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center">
              <div className="h-px w-8 bg-[#fcba6d]/50"></div>
              <span className="px-4 text-[#cd8539] font-medium">Discover</span>
              <div className="h-px w-8 bg-[#fcba6d]/50"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mt-3 mb-4">
              Explore the Farm
            </h2>
            <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
              Visit different areas of our virtual farm and discover our premium
              selection of poultry products
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCategories.map((category) => (
              <Link
                key={category.name}
                to={`/products?category=${category.name}`}
                className="group relative"
              >
                <div className="bg-white rounded-xl shadow-sm border border-[#ffecd4] p-6 hover:shadow-md transition-all overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fcba6d]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-br from-[#fff0dd] to-[#fff8ef] flex items-center justify-center group-hover:scale-110 transition-transform">
                      {getCategoryIcon(category.name)}
                    </div>
                    <h3 className="font-medium text-gray-900 capitalize group-hover:text-[#fcba6d] transition-colors">
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

      {/* Featured Products - REDESIGNED */}
      <section ref={featuredRef} className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10"
            data-aos="fade-up"
          >
            <div>
              <div className="inline-flex items-center mb-3">
                <div className="h-px w-8 bg-[#fcba6d]/50"></div>
                <span className="px-4 text-[#cd8539] font-medium">
                  Featured
                </span>
                <div className="h-px w-8 bg-[#fcba6d]/50"></div>
              </div>
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

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-8">
            {featuredProducts.map((product, index) => (
              <div
                key={product._id}
                className="group relative"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group-hover:-translate-y-1">
                  {/* Product image */}
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#fff8ef]">
                        <Egg className="h-16 w-16 text-[#fcba6d]/40" />
                      </div>
                    )}

                    {/* Wishlist button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToWishlist(product);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isInWishlist(product._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>

                    {/* Quick view */}
                    <Link
                      to={`/products/${product._id}`}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Eye className="h-5 w-5 text-gray-500" />
                    </Link>
                  </div>

                  {/* Product info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-[#fcba6d] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {product.rating?.toFixed(1) || "New"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#fcba6d]">
                        ${product.price?.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="p-2 rounded-lg bg-[#fff5e9] text-[#fcba6d] hover:bg-[#fcba6d] hover:text-white transition-colors"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals - REDESIGNED */}
      <section ref={newArrivalsRef} className="py-16 bg-[#fff5e9]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10"
            data-aos="fade-up"
          >
            <div>
              <div className="inline-flex items-center mb-3">
                <div className="h-px w-8 bg-[#fcba6d]/50"></div>
                <span className="px-4 text-[#cd8539] font-medium">New</span>
                <div className="h-px w-8 bg-[#fcba6d]/50"></div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Fresh From the Farm
              </h2>
              <p className="mt-2 text-gray-600 max-w-xl">
                Our newest arrivals, ready for your flock. These products have
                just been added to our collection.
              </p>
            </div>
            <Link
              to="/products?sort=-createdAt"
              className="mt-4 md:mt-0 text-[#fcba6d] hover:text-[#cd8539] font-medium flex items-center group"
            >
              View All
              <ArrowRight className="ml-1 h-4 w-4 group-hover:ml-2 transition-all duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-8">
            {newArrivals.map((product, index) => (
              <div
                key={product._id}
                className="group relative"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* New badge */}
                <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-[#fcba6d] text-white text-xs font-medium rounded-full shadow-sm">
                  New
                </div>

                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group-hover:-translate-y-1">
                  {/* Product image */}
                  <div className="aspect-square relative overflow-hidden bg-gray-50">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#fff8ef]">
                        <Egg className="h-16 w-16 text-[#fcba6d]/40" />
                      </div>
                    )}

                    {/* Wishlist button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToWishlist(product);
                      }}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isInWishlist(product._id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>

                    {/* Quick view */}
                    <Link
                      to={`/products/${product._id}`}
                      className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors z-10"
                    >
                      <Eye className="h-5 w-5 text-gray-500" />
                    </Link>
                  </div>

                  {/* Product info */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-[#fcba6d] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-500">
                          {product.rating?.toFixed(1) || "New"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="font-bold text-[#fcba6d]">
                        ${product.price?.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(product);
                        }}
                        className="p-2 rounded-lg bg-[#fff5e9] text-[#fcba6d] hover:bg-[#fcba6d] hover:text-white transition-colors"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - NEW */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-3">
              <div className="h-px w-8 bg-[#fcba6d]/50"></div>
              <span className="px-4 text-[#cd8539] font-medium">
                Testimonials
              </span>
              <div className="h-px w-8 bg-[#fcba6d]/50"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from our satisfied customers about their experience with our
              products and services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-[#fff8ef] rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="inline-block h-5 w-5 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 flex-grow italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-[#fcba6d]/20 flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-[#cd8539]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
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

      {/* Back to top button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 text-[#fcba6d] hover:text-[#cd8539]"
        >
          <ChevronUp className="h-6 w-6" />
        </button>
      </div>
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
                isInWishlist(product._id)
                  ? "fill-orange-400 text-orange-400"
                  : ""
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
          <div className="absolute bottom-2 left-2 bg-orange-400 text-white text-xs px-2 py-1 rounded">
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
