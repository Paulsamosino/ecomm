import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, addToCart } = useCart();

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your wishlist is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Save items you like to your wishlist so you can find them later.
          </p>
          <Link to="/products">
            <Button className="bg-primary hover:bg-primary/90">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link
          to="/products"
          className="text-gray-600 hover:text-primary flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">Your Wishlist</h2>
          <p className="text-gray-500 text-sm">
            {wishlistItems.length} saved items
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {wishlistItems.map((item) => (
            <div
              key={item._id}
              className="border border-gray-100 rounded-lg overflow-hidden shadow-sm group"
            >
              {/* Product Image */}
              <Link to={`/products/${item._id}`}>
                <div className="aspect-w-1 aspect-h-1 bg-gray-50 relative">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-48 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gray-100">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Product Details */}
              <div className="p-4">
                <Link to={`/products/${item._id}`}>
                  <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors mb-1">
                    {item.name}
                  </h3>
                </Link>
                {item.seller && (
                  <p className="text-sm text-gray-500">
                    By {item.seller.name || "Unknown Seller"}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </span>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => removeFromWishlist(item._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => addToCart(item, 1)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-full"
                      title="Add to cart"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
