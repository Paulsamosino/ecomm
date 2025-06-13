import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
  } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added any products to your cart yet.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Shopping Cart</h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear Cart
                </button>
              </div>
              <p className="text-gray-500 text-sm">
                {cartItems.length} items in your cart
              </p>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="p-6 flex flex-col sm:flex-row gap-4"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-amber-50 rounded-md overflow-hidden">
                    <img
                      src={item.images?.[0] || "/1f425.png"}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = "/1f425.png";
                      }}
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          <Link
                            to={`/products/${item._id}`}
                            className="hover:text-primary"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        {item.seller && (
                          <p className="text-sm text-gray-500">
                            Seller: {item.seller.name || "Unknown Seller"}
                          </p>
                        )}
                        {item.category && (
                          <p className="text-xs text-gray-400 mt-1">
                            Category: {item.category}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-0 text-right">
                        <p className="font-bold text-primary">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₱{item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity Controls and Remove */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border-2 border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-200">
                        <button
                          onClick={() =>
                            updateCartItemQuantity(item._id, item.quantity - 1)
                          }
                          className="px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 transition-colors font-medium"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 text-center min-w-[40px] text-orange-800 font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartItemQuantity(item._id, item.quantity + 1)
                          }
                          className="px-3 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 transition-colors font-medium"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700 flex items-center text-sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sticky top-24">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₱{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Marketplace Fee (2%)</span>
                <span>₱{(cartTotal * 0.02).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Free Shipping</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Taxes</span>
                <span>Included</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-3"></div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₱{(cartTotal + cartTotal * 0.02).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate("/checkout")}
              >
                Proceed to Checkout
              </Button>

              <Link
                to="/products"
                className="flex items-center justify-center text-primary hover:underline text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
