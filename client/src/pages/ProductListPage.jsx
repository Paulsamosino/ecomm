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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

// Categories for filtering - these match categories in seed.js
const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "chicken", label: "Chicken" },
  { id: "duck", label: "Duck" },
  { id: "turkey", label: "Turkey" },
  { id: "quail", label: "Quail" },
  { id: "other", label: "Equipment & Feed" },
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
    <div className="bg-gray-50 pb-12">
      {/* Page Header */}
      <div className="bg-primary/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Available Products
              </h1>
              <p className="text-gray-600">
                Browse our selection of quality poultry products
              </p>
            </div>
            {user?.role === "seller" && (
              <Link
                to="/seller/add-product"
                className="mt-4 md:mt-0 inline-flex items-center gap-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors"
              >
                <span>Add New Product</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  {getActiveFiltersCount() > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-xs text-primary hover:text-primary/80"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Categories
                  </h4>
                  <div className="space-y-2">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`category-${category.id}`}
                          checked={filters.category === category.id}
                          onChange={(e) =>
                            handleFilterChange(
                              "category",
                              e.target.checked ? category.id : "all"
                            )
                          }
                          className="mr-2"
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {category.label}
                        </label>
                      </div>
                    ))}
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
                    <div className="w-20 px-3 py-1 border border-gray-300 rounded-md">
                      <span className="text-xs text-gray-600">
                        ₱{priceRange[0]}
                      </span>
                    </div>
                    <span className="text-gray-400">-</span>
                    <div className="w-20 px-3 py-1 border border-gray-300 rounded-md">
                      <span className="text-xs text-gray-600">
                        ₱{priceRange[1]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Availability
                  </h4>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="in-stock"
                      checked={filters.inStock}
                      onChange={(e) =>
                        handleFilterChange("inStock", e.target.checked)
                      }
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label
                      htmlFor="in-stock"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      In Stock Only
                    </label>
                  </div>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Location
                  </h4>
                  <div className="space-y-2">
                    {LOCATIONS.map((location) => (
                      <div key={location} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`location-${location}`}
                          checked={filters.location === location}
                          onChange={() =>
                            handleFilterChange("location", location)
                          }
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`location-${location}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {location}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stores */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Popular Stores
                  </h4>
                  <div className="space-y-3">
                    {sellers.slice(0, 3).map((store) => (
                      <div
                        key={store.id}
                        className={`p-3 rounded-lg border ${
                          filters.store === store.id
                            ? "border-primary bg-primary/5"
                            : "border-gray-200"
                        } cursor-pointer`}
                        onClick={() =>
                          handleFilterChange(
                            "store",
                            filters.store === store.id ? null : store.id
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Store className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h5 className="font-medium text-sm">
                              {store.name}
                            </h5>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <Star
                                  size={10}
                                  className="fill-yellow-400 text-yellow-400"
                                />
                                {store.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {sellers.length > 3 && (
                      <button className="w-full text-primary text-sm font-medium hover:underline">
                        View All Stores
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Sorting */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Form */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </form>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                >
                  <Filter size={18} />
                  <span>Filter</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-primary text-white">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
                    <ArrowUpDown size={16} />
                    <span>Sort By</span>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 hidden group-hover:block">
                    <div className="py-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() =>
                            handleFilterChange("sortBy", option.id)
                          }
                          className={`w-full text-left px-4 py-2 text-sm ${
                            filters.sortBy === option.id
                              ? "bg-primary/10 text-primary"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView("grid")}
                    className={`flex items-center justify-center p-2 ${
                      view === "grid"
                        ? "bg-primary text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center justify-center p-2 ${
                      view === "list"
                        ? "bg-primary text-white"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    <ListFilter size={18} />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Active filters:</span>

                  {filters.category !== "all" && (
                    <FilterTag
                      label={`Category: ${
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

                  {filters.inStock && (
                    <FilterTag
                      label="In Stock Only"
                      onRemove={() => handleFilterChange("inStock", false)}
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
                        sellers.find((s) => s.id === filters.store)?.name
                      }`}
                      onRemove={() => handleFilterChange("store", null)}
                    />
                  )}

                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline ml-auto"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>

            {/* Product Count */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{products.length}</span>{" "}
                of <span className="font-medium">{totalProducts}</span> products
              </p>
            </div>

            {/* Products Display */}
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center py-24 text-red-500">
                <AlertCircle className="h-6 w-6 mr-2" />
                {error}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-lg shadow-sm">
                <div className="max-w-md mx-auto">
                  <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    We couldn't find any products matching your criteria. Try
                    adjusting your filters or search term.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <ProductListItem
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <ArrowLeft size={18} />
                      </button>

                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => paginate(index + 1)}
                          className={`w-9 h-9 flex items-center justify-center rounded-md ${
                            currentPage === index + 1
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}

                      <button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowFilters(false)}
          ></div>
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Mobile Categories */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        handleFilterChange("category", category.id)
                      }
                      className={`py-2 px-3 rounded-md text-sm font-medium ${
                        filters.category === category.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price Range */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
                <Slider
                  min={0}
                  max={1000}
                  step={10}
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  className="mb-3"
                />
                <div className="flex items-center justify-between">
                  <div className="w-20 px-3 py-1 border border-gray-300 rounded-md">
                    <span className="text-xs text-gray-600">
                      ₱{priceRange[0]}
                    </span>
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="w-20 px-3 py-1 border border-gray-300 rounded-md">
                    <span className="text-xs text-gray-600">
                      ₱{priceRange[1]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Sort By */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Sort By</h4>
                <div className="space-y-2">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleFilterChange("sortBy", option.id)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md ${
                        filters.sortBy === option.id
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span>{option.label}</span>
                      {filters.sortBy === option.id && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Availability */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
                <button
                  onClick={() =>
                    handleFilterChange("inStock", !filters.inStock)
                  }
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${
                    filters.inStock
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <span>In Stock Only</span>
                  {filters.inStock && <Check size={16} />}
                </button>
              </div>

              {/* Mobile Location */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                <div className="space-y-2">
                  {LOCATIONS.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleFilterChange("location", location)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md ${
                        filters.location === location
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      <span>{location}</span>
                      {filters.location === location && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={clearFilters}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const {
    _id,
    name,
    price,
    images,
    rating,
    quantity,
    seller,
    discount,
    isNew,
    tags,
  } = product;

  // Get review count safely
  const reviewCount =
    product.reviewCount || (product.reviews ? product.reviews.length : 0);

  const discountedPrice = discount ? price - (price * discount) / 100 : null;

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all border border-gray-100 group">
      <div className="relative">
        <Link to={`/products/${_id}`}>
          <div className="aspect-w-1 aspect-h-1 overflow-hidden bg-gray-100">
            <img
              src={images[0]}
              alt={name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Product tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {discount > 0 && (
            <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
              {discount}% OFF
            </span>
          )}
          {isNew && (
            <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-md">
              NEW
            </span>
          )}
          {tags &&
            tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-primary text-white text-xs font-bold rounded-md"
              >
                {tag}
              </span>
            ))}
        </div>

        {/* Quick action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddToWishlist(product)}
            className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors"
          >
            <Heart className="h-4 w-4" />
          </button>
          <button className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <Link to={`/products/${_id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>
        {seller && (
          <p className="text-sm text-gray-500 mb-2">by {seller.name}</p>
        )}

        <div className="flex items-center mb-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">
              {rating} ({reviewCount})
            </span>
          </div>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-sm text-gray-500">{quantity} in stock</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {discount > 0 ? (
              <>
                <span className="font-bold text-primary">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through ml-2">
                  ${price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-primary">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductListItem = ({ product, onAddToCart, onAddToWishlist }) => {
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
  <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="ml-1 p-0.5 text-gray-500 hover:text-gray-700"
    >
      <X size={14} />
    </button>
  </div>
);

export default ProductListPage;
