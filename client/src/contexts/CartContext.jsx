import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const CartContext = createContext();

const CART_STORAGE_KEY = "cart";
const WISHLIST_STORAGE_KEY = "wishlist";

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cart and wishlist from localStorage on mount and when user changes
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        setLoading(true);
        // Get data from localStorage
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);

        // Parse and validate cart data
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          if (Array.isArray(parsedCart)) {
            setCartItems(parsedCart);
          } else {
            console.error("Invalid cart data format");
            setCartItems([]);
          }
        }

        // Parse and validate wishlist data
        if (savedWishlist) {
          const parsedWishlist = JSON.parse(savedWishlist);
          if (Array.isArray(parsedWishlist)) {
            setWishlistItems(parsedWishlist);
          } else {
            console.error("Invalid wishlist data format");
            setWishlistItems([]);
          }
        }
      } catch (error) {
        console.error("Error loading cart from storage:", error);
        // Reset if there's an error
        setCartItems([]);
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadCartFromStorage();
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (!loading) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      }
    } catch (error) {
      console.error("Error saving cart to storage:", error);
    }
  }, [cartItems, loading]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      if (!loading) {
        localStorage.setItem(
          WISHLIST_STORAGE_KEY,
          JSON.stringify(wishlistItems)
        );
      }
    } catch (error) {
      console.error("Error saving wishlist to storage:", error);
    }
  }, [wishlistItems, loading]);

  const addToCart = (product, quantity = 1) => {
    if (!product?._id) {
      console.error("Invalid product data:", product);
      toast.error("Could not add item to cart");
      return;
    }

    setCartItems((prevItems) => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item._id === product._id
      );

      if (existingItemIndex >= 0) {
        // Update quantity if product exists
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        toast.success("Updated quantity in cart");
        return updatedItems;
      } else {
        // Add new product to cart
        toast.success("Added to cart");
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    if (!productId) {
      console.error("Invalid product ID for removal");
      return;
    }

    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item._id !== productId);
      toast.success("Removed from cart");
      return updatedItems;
    });
  };

  const updateCartItemQuantity = (productId, quantity) => {
    if (!productId) {
      console.error("Invalid product ID for quantity update");
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) => {
      return prevItems.map((item) =>
        item._id === productId ? { ...item, quantity } : item
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
    toast.success("Cart cleared");
  };

  // Wishlist functionality
  const addToWishlist = (product) => {
    if (!product?._id) {
      console.error("Invalid product data:", product);
      toast.error("Could not add item to wishlist");
      return;
    }

    setWishlistItems((prevItems) => {
      // Check if product already exists in wishlist
      const exists = prevItems.some((item) => item._id === product._id);

      if (exists) {
        toast.success("Already in your wishlist");
        return prevItems;
      } else {
        toast.success("Added to wishlist");
        return [...prevItems, product];
      }
    });
  };

  const removeFromWishlist = (productId) => {
    if (!productId) {
      console.error("Invalid product ID for wishlist removal");
      return;
    }

    setWishlistItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item._id !== productId);
      toast.success("Removed from wishlist");
      return updatedItems;
    });
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  // Calculate total price for cart
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate total number of items in cart
  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlistItems,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        cartTotal,
        cartItemCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
