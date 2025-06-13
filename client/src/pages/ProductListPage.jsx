import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetProducts } from "@/api/products";
import { useCart } from "@/contexts/CartContext";
import {
  Search,
  Filter,
  Star,
  ChevronDown,
  Loader2,
  AlertCircle,
  X,
  SlidersHorizontal,
  Check,
  MapPin,
  Store,
  Heart,
  ShoppingCart,
  Eye,
  ArrowUpDown,
  ChevronRight,
  ListFilter,
  Grid,
  ArrowLeft,
  ArrowRight,
  Bird,
  Egg,
  Sun,
  CloudRain,
  Leaf,
  ChevronUp,
  Calendar,
  Award,
  Tag,
  Truck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

// Categories with themed icons
const CATEGORIES = [
  { id: "all", label: "All Areas", icon: Store },
  { id: "chicken", label: "Chicken Coop", icon: Bird },
  { id: "duck", label: "Duck Pond", icon: Bird },
  { id: "turkey", label: "Turkey Run", icon: Bird },
  { id: "quail", label: "Quail Corner", icon: Bird },
  { id: "eggs", label: "Fresh Eggs", icon: Egg },
  { id: "other", label: "Farm Store", icon: Store },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First" },
  { id: "price_low", label: "Price: Low to High" },
  { id: "price_high", label: "Price: High to Low" },
  { id: "rating", label: "Highest Rated" },
];

const LOCATIONS = [
  "All Locations",
  "Cebu City",
  "Farm City, FC",
  "Ranch City, RC",
  "Poultry City, PC",
  "Freedom City, FR",
];

const ProductListPage = () => {
  const { user } = useAuth();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } =
    useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("grid");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sellers, setSellers] = useState([]);
  const sortDropdownRef = useRef(null);
  const sortButtonRef = useRef(null);
  const productListRef = useRef(null);

  // Get initial filters from URL params
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || 0,
    maxPrice: searchParams.get("maxPrice") || 1000,
    category: searchParams.get("category") || "all",
    sortBy: searchParams.get("sortBy") || "newest",
    inStock: searchParams.get("inStock") === "true" || false,
    location: searchParams.get("location") || "All Locations",
    store: searchParams.get("store") || null,
  });

  const [priceRange, setPriceRange] = useState([
    Number(filters.minPrice) || 0,
    Number(filters.maxPrice) || 1000,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  useEffect(() => {
    // Update URL params when filters change
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.minPrice > 0) params.minPrice = filters.minPrice;
    if (filters.maxPrice < 1000) params.maxPrice = filters.maxPrice;
    if (filters.category !== "all") params.category = filters.category;
    if (filters.sortBy && filters.sortBy !== "newest")
      params.sortBy = filters.sortBy;
    if (filters.inStock) params.inStock = true;
    if (filters.location !== "All Locations")
      params.location = filters.location;
    if (filters.store) params.store = filters.store;

    setSearchParams(params);

    // Reset to page 1 when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchProducts();
    }
  }, [filters]);

  useEffect(() => {
    if (!sortDropdownOpen) return;
    function handleClickOutside(event) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target)
      ) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sortDropdownOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Build query params for API request
      const queryParams = {
        page: currentPage,
        limit: productsPerPage,
      };

      // Add filters to query
      if (filters.search) queryParams.search = filters.search;
      if (filters.category !== "all") queryParams.category = filters.category;
      if (filters.minPrice > 0) queryParams.minPrice = filters.minPrice;
      if (filters.maxPrice < 1000) queryParams.maxPrice = filters.maxPrice;
      if (filters.inStock) queryParams.inStock = true;
      if (filters.location !== "All Locations")
        queryParams.location = filters.location;
      if (filters.store) queryParams.seller = filters.store;

      // Add sort option
      if (filters.sortBy === "price_low") {
        queryParams.sort = "price";
      } else if (filters.sortBy === "price_high") {
        queryParams.sort = "-price";
      } else if (filters.sortBy === "rating") {
        queryParams.sort = "-rating";
      } else {
        // Newest first
        queryParams.sort = "-createdAt";
      }

      // Fetch products from API
      const response = await apiGetProducts(queryParams);
      const responseData = response || { products: [], totalProducts: 0 };

      setProducts(responseData.products || []);
      setTotalProducts(
        responseData.totalProducts || responseData.products?.length || 0
      );
      setTotalPages(
        responseData.totalPages ||
          Math.ceil((responseData.products?.length || 0) / productsPerPage) ||
          1
      );

      // Extract unique sellers for the filter
      if (responseData.products && responseData.products.length > 0) {
        const uniqueSellers = Array.from(
          new Set(
            responseData.products
              .filter((product) => product.seller)
              .map((product) =>
                JSON.stringify({
                  id: product.seller._id,
                  name:
                    product.seller.name ||
                    product.seller.sellerProfile?.businessName ||
                    "Unknown Seller",
                  rating:
                    product.seller.rating ||
                    product.seller.sellerProfile?.rating ||
                    0,
                })
              )
          )
        ).map((seller) => JSON.parse(seller));

        setSellers(uniqueSellers);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products. Please try again later.");
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePriceRangeChange = (value) => {
    setPriceRange(value);
    setFilters((prev) => ({
      ...prev,
      minPrice: value[0],
      maxPrice: value[1],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      minPrice: 0,
      maxPrice: 1000,
      category: "all",
      sortBy: "newest",
      inStock: false,
      location: "All Locations",
      store: null,
    });
    setPriceRange([0, 1000]);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category !== "all") count++;
    if (filters.minPrice > 0 || filters.maxPrice < 1000) count++;
    if (filters.sortBy !== "newest") count++;
    if (filters.inStock) count++;
    if (filters.location !== "All Locations") count++;
    if (filters.store) count++;
    return count;
  };

  // Pagination handlers
  const scrollToProductList = () => {
    if (productListRef.current) {
      productListRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    scrollToProductList();
  };
  const nextPage = () => {
    setCurrentPage((prev) => {
      const next = Math.min(prev + 1, totalPages);
      setTimeout(scrollToProductList, 0);
      return next;
    });
  };
  const prevPage = () => {
    setCurrentPage((prev) => {
      const prevNum = Math.max(prev - 1, 1);
      setTimeout(scrollToProductList, 0);
      return prevNum;
    });
  };
  // Event handlers for cart and wishlist
  const handleAddToCart = (product) => {
    // Using default showToast=true since there's no duplicate toast here
    addToCart(product, 1, true);
  };

  const handleAddToWishlist = (product) => {
    // Using default showToast=true since there's no duplicate toast here
    addToWishlist(product, true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section - Modern Farm Theme */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#fff8ef] to-[#fff2e2] border-b">
        {/* Modern abstract shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/farm-pattern.svg')] bg-repeat bg-center opacity-5"></div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-[#fcba6d]/10 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#e8f4ea]/20 to-transparent"></div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-[#fcba6d]/10 rounded-full filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-[#e8f4ea]/20 rounded-full filter blur-xl animate-pulse-slow"></div>

        {/* Floating icons */}
        <div className="hidden md:block">
          <Sun className="absolute top-12 right-[15%] h-12 w-12 text-[#fcba6d] animate-pulse opacity-40" />
          <Bird className="absolute top-[30%] right-[25%] h-8 w-8 text-[#cd8539] animate-bounce-slow opacity-30" />
          <Leaf className="absolute bottom-[20%] left-[20%] h-6 w-6 text-[#8fbc8f] animate-float opacity-30" />
        </div>

        <div className="relative pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10">
              <div className="text-center md:text-left max-w-2xl">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-[#cd8539] text-sm font-medium mb-4 md:mb-6 shadow-sm animate-float border border-[#ffecd4]">
                  <Bird className="h-4 w-4 mr-2" />
                  <span className="relative">Farm Fresh Selection</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                  Explore Our{" "}
                  <span className="text-[#fcba6d] relative inline-block">
                    Farm Collection
                    <svg
                      className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-2 text-[#fcba6d]/20"
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

                <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
                  Browse our premium selection of quality poultry, farm-fresh
                  eggs, and essential supplies for your backyard flock.
                </p>

                <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-4 mt-6 sm:mt-8">
                  {[
                    { icon: Award, text: "Premium Quality" },
                    { icon: Truck, text: "Fast Delivery" },
                    { icon: Shield, text: "Verified Sellers" },
                  ].map((feature) => (
                    <div
                      key={feature.text}
                      className="flex items-center justify-center text-gray-600 text-sm bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-sm"
                    >
                      <feature.icon className="h-4 w-4 text-[#fcba6d] mr-2 flex-shrink-0" />
                      {feature.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-6">
                {user?.role === "seller" && (
                  <Link
                    to="/seller/products/new"
                    className="inline-flex items-center gap-2 bg-[#fcba6d] hover:bg-[#eead5f] text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    <Store className="h-5 w-5" />
                    <span>List Your Products</span>
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Link>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-sm border border-[#ffecd4]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fff5e9] flex items-center justify-center">
                      <Tag className="h-5 w-5 text-[#fcba6d]" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-500">Total Products</p>
                      <p className="text-xl font-bold text-gray-900">
                        {totalProducts}
                      </p>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#fff5e9] flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-[#fcba6d]" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-gray-500">Locations</p>
                      <p className="text-xl font-bold text-gray-900">
                        {LOCATIONS.length - 1}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-[#ffecd4]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-[#fcba6d]" />
                    <h3 className="font-semibold text-gray-900">
                      Filter Collection
                    </h3>
                  </div>
                  {getActiveFiltersCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-[#fcba6d] hover:text-[#cd8539] font-medium flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </button>
                  )}
                </div>

                {/* Categories with Icons */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-4 w-4 text-[#fcba6d]" />
                    Farm Areas
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const isActive = filters.category === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() =>
                            handleFilterChange("category", category.id)
                          }
                          className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-[#fff5e9] text-[#cd8539] shadow-sm border border-[#ffecd4]"
                              : "hover:bg-gray-50 text-gray-700 border border-transparent"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-full ${
                              isActive ? "bg-[#fcba6d]/10" : "bg-gray-100"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                isActive ? "text-[#fcba6d]" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {category.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Select a farm area to filter products
                    </p>
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#fcba6d]" />
                    Price Range
                  </h4>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    className="mb-5"
                  />
                  <div className="flex items-center justify-between bg-[#fff8ef] p-3 rounded-lg border border-[#ffecd4]">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">Min</span>
                      <span className="text-sm font-medium text-[#cd8539]">
                        ₱{priceRange[0]}
                      </span>
                    </div>
                    <div className="h-px w-12 bg-[#ffecd4]"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">Max</span>
                      <span className="text-sm font-medium text-[#cd8539]">
                        ₱{priceRange[1]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Other filters ... */}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search, Sort, and Active Filters Bar */}
            <div className="bg-white rounded-xl shadow-sm mb-4 border border-[#ffecd4] flex flex-col gap-0">
              <div className="p-3 sm:p-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      className="w-full pl-10 pr-4 h-11 text-sm sm:text-base rounded-lg border border-[#ffecd4] focus:outline-none focus:ring-2 focus:ring-[#fcba6d]/20 focus:border-[#fcba6d] bg-[#fff8ef]/50 text-gray-700 placeholder-gray-400"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#fcba6d]">
                      <Search className="h-5 w-5" />
                    </div>
                  </div>
                </form>
              </div>

              <div className="grid grid-cols-3 border-t border-[#ffecd4]">
                <div className="flex flex-1 items-center justify-center h-12 gap-2 text-[#cd8539] cursor-default select-none">
                  <Filter className="h-5 w-5" />
                  <span className="text-sm font-medium">Filters</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-[#fcba6d] text-white">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </div>
                {/* Sort Dropdown */}
                <div className="relative flex-1 border-x border-[#ffecd4]">
                  <button
                    ref={sortButtonRef}
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    className="flex w-full h-12 items-center justify-center gap-2 text-[#cd8539] hover:bg-[#fff8ef] transition-colors"
                  >
                    <ArrowUpDown className="h-5 w-5" />
                    <span className="text-sm font-medium">Sort</span>
                    <ChevronDown
                      className={`h-5 w-5 text-[#fcba6d] transition-transform duration-200 ${
                        sortDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {sortDropdownOpen && (
                    <div
                      ref={sortDropdownRef}
                      className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-[#ffecd4] overflow-hidden"
                    >
                      <div className="py-1">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => {
                              handleFilterChange("sortBy", option.id);
                              // Don't close dropdown after selection so user can see their choice
                            }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                              filters.sortBy === option.id
                                ? "bg-[#fff8ef] text-[#cd8539] font-medium"
                                : "text-gray-700 hover:bg-[#fff8ef]/50"
                            }`}
                          >
                            {filters.sortBy === option.id && (
                              <Check className="h-4 w-4 text-[#fcba6d]" />
                            )}
                            <span
                              className={
                                filters.sortBy === option.id ? "" : "ml-6"
                              }
                            >
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* View Toggle */}
                <div className="flex flex-1 h-12 divide-x divide-[#ffecd4]">
                  <button
                    onClick={() => setView("grid")}
                    className={`flex-1 flex items-center justify-center transition-colors ${
                      view === "grid"
                        ? "bg-[#fff8ef] text-[#fcba6d]"
                        : "text-[#cd8539] hover:bg-[#fff8ef]"
                    }`}
                    title="Grid View"
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex-1 flex items-center justify-center transition-colors ${
                      view === "list"
                        ? "bg-[#fff8ef] text-[#fcba6d]"
                        : "text-[#cd8539] hover:bg-[#fff8ef]"
                    }`}
                    title="List View"
                  >
                    <ListFilter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="active-filters-bar flex flex-wrap items-center gap-2 mt-2 mb-2 px-4 py-2 bg-[#fffbe6] border-t border-[#ffecd4] rounded-b-xl">
                  <span className="text-sm text-gray-500 mr-2">
                    Active filters:
                  </span>
                  {filters.category !== "all" && (
                    <FilterTag
                      label={`Area: ${
                        CATEGORIES.find((c) => c.id === filters.category)?.label
                      }`}
                      onRemove={() => handleFilterChange("category", "all")}
                    />
                  )}
                  {(filters.minPrice > 0 || filters.maxPrice < 1000) && (
                    <FilterTag
                      label={`Price: ₱${filters.minPrice} - ₱${filters.maxPrice}`}
                      onRemove={() => {
                        setPriceRange([0, 1000]);
                        handleFilterChange("minPrice", 0);
                        handleFilterChange("maxPrice", 1000);
                      }}
                    />
                  )}
                  {filters.sortBy !== "newest" && (
                    <FilterTag
                      label={`Sort: ${
                        SORT_OPTIONS.find((o) => o.id === filters.sortBy)?.label
                      }`}
                      onRemove={() => handleFilterChange("sortBy", "newest")}
                    />
                  )}
                  {filters.location !== "All Locations" && (
                    <FilterTag
                      label={`Location: ${filters.location}`}
                      onRemove={() =>
                        handleFilterChange("location", "All Locations")
                      }
                    />
                  )}
                  {filters.store && (
                    <FilterTag
                      label={`Store: ${
                        sellers.find((s) => s.id === filters.store)?.name ||
                        "Selected Store"
                      }`}
                      onRemove={() => handleFilterChange("store", null)}
                    />
                  )}
                  {filters.inStock && (
                    <FilterTag
                      label="In Stock Only"
                      onRemove={() => handleFilterChange("inStock", false)}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Products Display */}
            <div ref={productListRef} />
            {loading ? (
              <div className="flex flex-col justify-center items-center py-32 bg-white rounded-xl border border-[#ffecd4] shadow-sm">
                <div className="relative w-16 h-16 mb-4">
                  <Egg className="absolute inset-0 h-16 w-16 text-[#fcba6d]/30" />
                  <Loader2 className="absolute inset-0 h-16 w-16 animate-spin text-[#fcba6d]" />
                </div>
                <span className="text-gray-600 font-medium">
                  Loading farm products...
                </span>
                <p className="text-sm text-gray-500 mt-2">
                  Gathering the freshest items for you
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-24 bg-white rounded-xl border border-red-100 shadow-sm">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={fetchProducts}
                  className="mt-6 px-4 py-2 bg-[#fcba6d] text-white rounded-lg hover:bg-[#eead5f] transition-colors shadow-sm"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              <EmptyState clearFilters={clearFilters} />
            ) : (
              <div>
                <div className="mb-4 sm:mb-8 bg-[#fff8ef]/50 px-4 sm:px-5 py-3 rounded-xl border border-[#ffecd4] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium text-[#cd8539]">
                      {products.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-[#cd8539]">
                      {totalProducts}
                    </span>{" "}
                    products
                  </p>
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-[#fcba6d]" />
                    Updated recently
                  </div>
                </div>

                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-6 auto-rows-fr"
                      : "space-y-4 sm:space-y-6"
                  }
                >
                  {products.map((product) =>
                    view === "grid" ? (
                      <FarmProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                        onToggleWishlist={() => {
                          if (isInWishlist(product._id)) {
                            removeFromWishlist(product._id, false);
                          } else {
                            addToWishlist(product);
                          }
                        }}
                        isInWishlist={isInWishlist}
                      />
                    ) : (
                      <FarmProductListItem
                        key={product._id}
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                        onAddToWishlist={() => handleAddToWishlist(product)}
                      />
                    )
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center gap-1 px-2 bg-white py-3 rounded-xl shadow-sm border border-[#ffecd4]">
                      <PaginationButton
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        icon={<ArrowLeft className="h-4 w-4" />}
                      />

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNumber = i + 1;
                        // Show first page, last page, and pages around current page
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 &&
                            pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationNumber
                              key={pageNumber}
                              pageNumber={pageNumber}
                              currentPage={currentPage}
                              onClick={() => paginate(pageNumber)}
                            />
                          );
                        }

                        // Show dots for skipped pages
                        if (pageNumber === 2 || pageNumber === totalPages - 1) {
                          return (
                            <span
                              key={`dots-${pageNumber}`}
                              className="px-1 text-gray-400 flex items-center justify-center text-lg select-none"
                            >
                              ...
                            </span>
                          );
                        }

                        return null;
                      })}

                      <PaginationButton
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        icon={<ArrowRight className="h-4 w-4" />}
                      />
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>

          {showFilters && (
            <MobileFiltersDrawer
              filters={filters}
              priceRange={priceRange}
              handleFilterChange={handleFilterChange}
              handlePriceRangeChange={handlePriceRangeChange}
              clearFilters={clearFilters}
              setShowFilters={setShowFilters}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const FarmProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
}) => {
  const {
    _id,
    name,
    breed,
    price,
    images,
    rating,
    quantity,
    seller,
    age,
    discount,
  } = product;

  const reviewCount = product.reviews?.length || 0;
  const discountedPrice = discount ? price - (price * discount) / 100 : null;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-[#ffecd4] hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-t from-[#fff8ef]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <Link to={`/products/${_id}`}>
          <div className="aspect-square overflow-hidden bg-[#fff8ef]/30 flex items-center justify-center">
            {images && images.length > 0 ? (
              typeof images[0] === "string" &&
              (images[0] === "🐣" || images[0].includes("demo")) ? (
                <div className="w-full h-full flex items-center justify-center bg-[#fff8ef]/50">
                  <img
                    src="/1f425.png"
                    alt="Baby chick"
                    className="w-28 h-28 group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
              ) : (
                <img
                  src={images[0]}
                  alt={name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#fff8ef]/50">
                <img
                  src="/1f425.png"
                  alt="Baby chick"
                  className="w-28 h-28 group-hover:scale-110 transition-transform duration-500 ease-out"
                />
              </div>
            )}
          </div>
        </Link>

        {/* Quick Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button
            onClick={() => onToggleWishlist(product)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
            title={
              isInWishlist(product._id)
                ? "Remove from Wishlist"
                : "Add to Wishlist"
            }
          >
            <Heart
              className={`h-5 w-5 ${
                isInWishlist(product._id)
                  ? "fill-red-500 text-red-500"
                  : "text-[#fcba6d]"
              }`}
            />
          </button>
          <Link to={`/products/${_id}`}>
            <button
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
              title="View Details"
            >
              <Eye className="h-5 w-5 text-[#fcba6d]" />
            </button>
          </Link>
        </div>

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {quantity === 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium shadow-sm">
              Sold Out
            </span>
          )}
          {age > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#fff0dd] text-[#cd8539] text-xs font-medium shadow-sm">
              {age} {age === 1 ? "month" : "months"} old
            </span>
          )}
          {discount > 0 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="relative p-5">
        <Link to={`/products/${_id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-[#fcba6d] transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        {seller && (
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <Store className="h-4 w-4 mr-1 text-[#fcba6d]" />
            {seller.name ||
              seller.sellerProfile?.businessName ||
              "Unknown Farm"}
          </p>
        )}

        <div className="flex items-center mt-3 bg-[#fff8ef] px-3 py-1.5 rounded-full w-fit">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm text-gray-700 ml-1 font-medium">
            {rating?.toFixed(1) || "New"}
          </span>
          {reviewCount > 0 && (
            <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1">
            {discountedPrice ? (
              <>
                <span className="font-bold text-[#fcba6d] text-lg">
                  ₱{discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₱{price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-[#fcba6d] text-lg">
                ₱{price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={quantity === 0}
            className={`p-2.5 rounded-lg ${
              quantity === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#fff5e9] text-[#fcba6d] hover:bg-[#fcba6d] hover:text-white"
            } transition-colors shadow-sm`}
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FarmProductListItem = ({ product, onAddToCart, onAddToWishlist }) => {
  const {
    _id,
    name,
    breed,
    price,
    images,
    rating,
    quantity,
    description,
    location,
    seller,
    discount,
  } = product;

  // Get review count safely
  const reviewCount =
    product.reviewCount || (product.reviews ? product.reviews.length : 0);

  const discountedPrice = discount ? price - (price * discount) / 100 : null;

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-orange-100 group">
      <div className="relative sm:w-48 md:w-56">
        <Link to={`/products/${_id}`}>
          <div className="aspect-w-1 aspect-h-1 overflow-hidden bg-orange-50">
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
        {discount > 0 && (
          <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-md shadow-sm">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="flex-1 p-4">
        <Link to={`/products/${_id}`} className="block">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors mb-1">
            {name}
          </h3>
          {breed && (
            <p className="text-sm text-gray-500 mb-1">Breed: {breed}</p>
          )}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {rating > 0 ? (
                <>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">
                    {rating.toFixed(1)}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-500">No ratings yet</span>
              )}
            </div>
            {reviewCount > 0 && (
              <span className="text-xs text-gray-500">
                ({reviewCount} reviews)
              </span>
            )}
            {location && (
              <span className="text-xs text-gray-500 flex items-center ml-2">
                <MapPin className="h-3 w-3 mr-1" />
                {location}
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-end gap-2 mb-3">
          {discountedPrice ? (
            <>
              <span className="text-lg font-bold text-orange-600">
                ${discountedPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-orange-600">
              ${price.toFixed(2)}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

        <div className="flex flex-wrap gap-2 mt-auto">
          <Button
            size="sm"
            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-sm"
            onClick={() => onAddToCart(product)}
            disabled={quantity < 1}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add to Cart
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={() => onAddToWishlist(product)}
          >
            <Heart className="h-4 w-4 mr-1" />
            Wishlist
          </Button>
          <Button
            size="sm"
            variant="outline"
            to={`/products/${_id}`}
            className="ml-auto text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

const FilterTag = ({ label, onRemove }) => (
  <div className="flex items-center bg-amber-50 rounded-full px-3 py-1 text-sm text-amber-700 border border-amber-200">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="ml-1 p-0.5 text-amber-400 hover:text-amber-600"
    >
      <X className="h-4 w-4" />
    </button>
  </div>
);

const EmptyState = ({ clearFilters }) => (
  <div className="text-center py-24 bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="max-w-md mx-auto">
      <Bird className="h-12 w-12 mx-auto text-amber-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No products found
      </h3>
      <p className="text-gray-600 mb-6">
        We couldn't find any products matching your criteria. Try adjusting your
        filters or search term.
      </p>
      <button
        onClick={clearFilters}
        className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  </div>
);

const PaginationButton = ({ onClick, disabled, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 border border-transparent bg-white shadow-sm
      ${
        disabled
          ? "text-gray-300 cursor-not-allowed bg-gray-50"
          : "text-amber-600 hover:bg-[#fffbe6] hover:border-[#ffecd4] focus:ring-2 focus:ring-amber-200"
      }
    `}
    style={{ minWidth: 36, minHeight: 36 }}
  >
    {icon}
  </button>
);

const PaginationNumber = ({ pageNumber, currentPage, onClick }) => (
  <button
    onClick={onClick}
    className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-200
      ${
        currentPage === pageNumber
          ? "bg-gradient-to-br from-[#fcba6d] to-[#cd8539] text-white shadow-md scale-105"
          : "text-[#cd8539] hover:bg-[#fffbe6] hover:border-[#ffecd4] border border-transparent bg-white"
      }
    `}
    style={{ minWidth: 36, minHeight: 36 }}
    aria-current={currentPage === pageNumber ? "page" : undefined}
  >
    {pageNumber}
  </button>
);

const MobileFiltersDrawer = ({
  filters,
  priceRange,
  handleFilterChange,
  handlePriceRangeChange,
  clearFilters,
  setShowFilters,
}) => {
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setShowFilters(false)}
      />
      <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg">
        {/* Filters content */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Add your filter components here */}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
