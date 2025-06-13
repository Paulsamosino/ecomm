import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Egg,
  PlusCircle,
  Wheat,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { apiGetSellerProducts, apiDeleteProduct } from "@/api/products";

const SellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await apiGetSellerProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error(error.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await apiDeleteProduct(productId);
      setProducts(products.filter((product) => product._id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
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
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === "price") {
        return sortOrder === "desc" ? b.price - a.price : a.price - b.price;
      }
      if (sortBy === "stock") {
        return sortOrder === "desc"
          ? b.quantity - a.quantity
          : a.quantity - b.quantity;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center">
          <div className="flex space-x-2">
            <div
              className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
            <div
              className="w-3 h-3 rounded-full bg-orange-500 animate-bounce"
              style={{ animationDelay: "600ms" }}
            ></div>
          </div>
          <p className="text-orange-600 mt-4 text-sm">
            Loading your products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center">
            <Package className="h-5 w-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-800">Your Products</h2>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "product" : "products"} in your
            inventory
          </p>
        </div>
        <Link
          to="/seller/products/new"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-orange-500 hover:to-orange-700 transition-all shadow-md"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/50">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-400" />
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <select
                  className="appearance-none w-full pl-4 pr-10 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 bg-white text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="chicken">Chicken</option>
                  <option value="duck">Duck</option>
                  <option value="quail">Quail</option>
                  <option value="turkey">Turkey</option>
                  <option value="other">Other</option>
                </select>
                <Filter className="absolute right-3 top-2.5 h-4 w-4 text-orange-400 pointer-events-none" />
              </div>

              <div className="relative flex-1 md:flex-none">
                <select
                  className="appearance-none w-full pl-4 pr-10 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400/20 bg-white text-sm"
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-");
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="price-desc">Highest Price</option>
                  <option value="price-asc">Lowest Price</option>
                  <option value="stock-desc">Most Stock</option>
                  <option value="stock-asc">Least Stock</option>
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Price
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Stock
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-orange-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  className="border-b border-orange-100 last:border-0 hover:bg-orange-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg overflow-hidden border border-orange-200 shadow-sm">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {product.breed}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="capitalize inline-flex items-center">
                      {product.category === "chicken" && (
                        <Egg className="h-3 w-3 mr-1 text-orange-500" />
                      )}
                      {product.category === "turkey" && (
                        <Wheat className="h-3 w-3 mr-1 text-orange-500" />
                      )}
                      <span className="text-gray-700">{product.category}</span>
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-800">
                    ₱{product.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-gray-700">
                    {product.quantity}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.quantity > 10
                          ? "bg-green-100 text-green-800"
                          : product.quantity > 0
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.quantity > 10
                        ? "In Stock"
                        : product.quantity > 0
                        ? "Low Stock"
                        : "Out of Stock"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${product._id}`}
                        title="View product"
                        className="p-1.5 hover:bg-orange-100 rounded-md transition-colors"
                      >
                        <Eye className="h-4 w-4 text-orange-600" />
                      </Link>
                      <Link
                        to={`/seller/products/edit/${product._id}`}
                        title="Edit product"
                        className="p-1.5 hover:bg-orange-100 rounded-md transition-colors"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        title="Delete product"
                        className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="bg-orange-50 rounded-xl p-8 max-w-md mx-auto border border-orange-100">
              <Package className="h-12 w-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                Start selling by adding your first poultry product
              </p>
              <Link
                to="/seller/products/new"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 transition-all shadow-md"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add your first product
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
