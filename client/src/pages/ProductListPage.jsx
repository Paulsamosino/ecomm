import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

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
  const { addToCart, addToWishlist } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState("grid"); // 'grid' or 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sellers, setSellers] = useState([]);

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
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  // Event handlers for cart and wishlist
  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleAddToWishlist = (product) => {
    addToWishlist(product);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Hero Section with Farm Theme */}
      <div className="relative overflow-hidden bg-white border-b">
        <div className="absolute inset-0 bg-[url('/farm-pattern.svg')] bg-center opacity-5"></div>
        <Sun className="absolute top-10 right-10 h-16 w-16 text-amber-300 animate-pulse opacity-30" />
        <CloudRain className="absolute top-20 right-32 h-8 w-8 text-blue-300 animate-float opacity-20" />

        <div className="relative pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left max-w-2xl">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-6">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-800">
                    <Bird className="h-4 w-4 mr-2" />
                    Farm Fresh Selection
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                    <Store className="h-4 w-4 mr-2" />
                    Local Farmers
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight sm:text-5xl">
                  Explore Our Farm
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Browse our selection of quality poultry, farm-fresh eggs, and
                  essential supplies
                </p>
              </div>

              <div className="flex flex-col items-center md:items-end gap-4">
                {user?.role === "seller" && (
                  <Link
                    to="/seller/products/new"
                    className="inline-flex items-center gap-2 bg-amber-700 hover:bg-amber-800 text-white px-6 py-3 rounded-full transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:translate-y-[-1px]"
                  >
                    <span>List Your Products</span>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    {totalProducts} Products
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Multiple Locations
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-amber-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    Filter Products
                  </h3>
                  {getActiveFiltersCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-amber-600 hover:text-amber-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Categories with Icons */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Farm Areas
                  </h4>
                  <div className="space-y-2">
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() =>
                            handleFilterChange("category", category.id)
                          }
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            filters.category === category.id
                              ? "bg-amber-100 text-amber-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              filters.category === category.id
                                ? "text-amber-600"
                                : "text-gray-400"
                            }`}
                          />
                          <span>{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Price Range
                  </h4>
                  <Slider
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={handlePriceRangeChange}
                    className="mb-3"
                  />
                  <div className="flex items-center justify-between">
                    <div className="w-20 px-3 py-1.5 border border-amber-200 rounded-lg bg-amber-50">
                      <span className="text-xs text-amber-800">
                        ₱{priceRange[0]}
                      </span>
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="w-20 px-3 py-1.5 border border-amber-200 rounded-lg bg-amber-50">
                      <span className="text-xs text-amber-800">
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
            {/* Search and Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search our farm products..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50/50"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 h-5 w-5" />
                  </div>
                </form>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50"
                >
                  <Filter className="h-5 w-5" />
                  <span>Filter</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-amber-600 text-white">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-200 text-amber-700 bg-amber-50">
                    <ArrowUpDown className="h-5 w-5" />
                    <span>Sort By</span>
                    <ChevronDown className="h-5 w-5 text-amber-400" />
                  </button>

                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 hidden group-hover:block border border-amber-100">
                    <div className="py-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleFilterChange("sortBy", option.id)
                          }
                          className={`w-full text-left px-4 py-2 text-sm ${
                            filters.sortBy === option.id
                              ? "bg-amber-50 text-amber-700"
                              : "text-gray-700 hover:bg-amber-50/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-amber-200 rounded-lg overflow-hidden bg-amber-50">
                  <button
                    onClick={() => setView("grid")}
                    className={`flex items-center justify-center p-2 ${
                      view === "grid"
                        ? "bg-amber-600 text-white"
                        : "text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center justify-center p-2 ${
                      view === "list"
                        ? "bg-amber-600 text-white"
                        : "text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    <ListFilter className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-amber-100">
                  {filters.category !== "all" && (
                    <FilterTag
                      label={`Area: ${
                        CATEGORIES.find((c) => c.id === filters.category)?.label
                      }`}
                      onRemove={() => handleFilterChange("category", "all")}
                    />
                  )}
                  {/* ... other filter tags ... */}
                </div>
              )}
            </div>

            {/* Products Display */}
            {loading ? (
              <div className="flex justify-center items-center py-24 bg-white rounded-lg border border-gray-200">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-24 text-red-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                {error}
              </div>
            ) : products.length === 0 ? (
              <EmptyState clearFilters={clearFilters} />
            ) : (
              <div>
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-medium">{products.length}</span> of{" "}
                    <span className="font-medium">{totalProducts}</span>{" "}
                    products
                  </p>
                </div>

                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {products.map((product) =>
                    view === "grid" ? (
                      <FarmProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                        isInWishlist={(id) => product._id === id}
                      />
                    ) : (
                      <FarmProductListItem
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                      />
                    )
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center gap-1 rounded-lg bg-white p-2 shadow-sm border border-amber-100">
                      <PaginationButton
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        icon={<ArrowLeft className="h-4 w-4" />}
                      />

                      {/* Page Numbers */}
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        return (
                          <PaginationNumber
                            key={index}
                            pageNumber={pageNumber}
                            currentPage={currentPage}
                            onClick={() => paginate(pageNumber)}
                          />
                        );
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
        </div>
      </div>

      {/* Mobile Filters Modal */}
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
  );
};

const FarmProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
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

  const reviewCount = product.reviewCount || product.reviews?.length || 0;
  const discountedPrice = discount ? price - (price * discount) / 100 : null;

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200">
      <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        <Link to={`/products/${_id}`}>
          <div className="aspect-square overflow-hidden bg-gray-50 flex items-center justify-center">
            {images && images.length > 0 ? (
              typeof images[0] === "string" &&
              (images[0] === "🐣" || images[0].includes("demo")) ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src="/1f425.png"
                    alt="Baby chick"
                    className="w-24 h-24 hover:scale-110 transition-transform"
                  />
                </div>
              ) : (
                <img
                  src={images[0]}
                  alt={name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/1f425.png"
                  alt="Baby chick"
                  className="w-24 h-24 hover:scale-110 transition-transform"
                />
              </div>
            )}
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
                isInWishlist(product._id)
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
          {discount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="relative p-4">
        <Link to={`/products/${_id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
            {name}
          </h3>
        </Link>

        {breed && <p className="text-sm text-gray-500 mt-1">Breed: {breed}</p>}

        {seller && (
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <Store className="h-3 w-3 mr-1 text-amber-600" />
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
          {reviewCount > 0 && (
            <span className="text-sm text-gray-400 ml-1">({reviewCount})</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1">
            {discountedPrice ? (
              <>
                <span className="font-bold text-amber-600">
                  ₱{discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₱{price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-amber-600">
                ₱{price.toFixed(2)}
              </span>
            )}
          </div>
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
    <div className="flex flex-col sm:flex-row bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all border border-gray-100 group">
      <div className="relative sm:w-48 md:w-56">
        <Link to={`/products/${_id}`}>
          <div className="aspect-w-1 aspect-h-1 overflow-hidden bg-gray-100">
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
        {discount > 0 && (
          <span className="absolute top-2 left-2 inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
            {discount}% OFF
          </span>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="mb-auto">
          <div className="flex items-center justify-between mb-1">
            <Link to={`/products/${_id}`}>
              <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="text-sm text-gray-600">
                {rating} ({reviewCount})
              </span>
            </div>
          </div>

          {breed && (
            <p className="text-sm text-gray-500 mb-2">Breed: {breed}</p>
          )}

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {description}
          </p>

          <div className="flex items-center text-sm text-gray-500 gap-4 mb-3">
            <div className="flex items-center">
              <MapPin size={14} className="mr-1" />
              {location}
            </div>
            {seller && <div>Seller: {seller.name}</div>}
            <div>{quantity} in stock</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center">
            {discount > 0 ? (
              <>
                <span className="font-bold text-primary text-lg">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through ml-2">
                  ${price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-primary text-lg">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddToWishlist(product)}
              className="p-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Heart className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
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
    className={`p-2 rounded-md transition-colors ${
      disabled
        ? "text-gray-300 cursor-not-allowed"
        : "text-amber-600 hover:bg-amber-50"
    }`}
  >
    {icon}
  </button>
);

const PaginationNumber = ({ pageNumber, currentPage, onClick }) => (
  <button
    onClick={onClick}
    className={`min-w-[2.25rem] h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
      currentPage === pageNumber
        ? "bg-amber-600 text-white"
        : "text-gray-700 hover:bg-amber-50"
    }`}
  >
    {pageNumber}
  </button>
);

export default ProductListPage;
