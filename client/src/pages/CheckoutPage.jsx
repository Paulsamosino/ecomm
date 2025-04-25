import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { PayPalButton } from "@/components/PayPalButton";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [shippingDetails, setShippingDetails] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  // Validate stock availability before proceeding
  useEffect(() => {
    const validateStock = async () => {
      setIsValidatingStock(true);
      setStockError(null);

      try {
        const token = localStorage.getItem("token");
        const stockChecks = await Promise.all(
          cartItems.map(async (item) => {
            const response = await fetch(`${API_URL}/api/products/${item._id}`);
            const product = await response.json();
            return {
              id: item._id,
              name: product.name,
              available: product.quantity,
              requested: item.quantity,
            };
          })
        );

        const insufficientStock = stockChecks.filter(
          (item) => item.requested > item.available
        );

        if (insufficientStock.length > 0) {
          setStockError(
            `Insufficient stock for: ${insufficientStock
              .map((item) => item.name)
              .join(", ")}`
          );
        }
      } catch (error) {
        console.error("Error validating stock:", error);
        setStockError("Could not validate product availability");
      } finally {
        setIsValidatingStock(false);
      }
    };

    if (cartItems.length > 0) {
      validateStock();
    }
  }, [cartItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid = () => {
    return Object.values(shippingDetails).every((value) => value.trim() !== "");
  };

  const calculateTotalWithFees = () => {
    const platformFee = cartTotal * 0.02; // 2% platform fee
    return cartTotal + platformFee;
  };

  const handlePaymentSuccess = async (order) => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to complete your purchase");
        navigate("/login");
        return;
      }

      // Get the first seller from cart items (assuming single seller orders)
      const firstItem = cartItems[0];
      if (!firstItem?.seller?._id) {
        toast.error("Invalid seller information");
        return;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seller: firstItem.seller._id,
          items: cartItems.map((item) => ({
            product: item._id,
            seller: item.seller._id,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentInfo: {
            method: "paypal",
            status: "completed",
            transactionId: order.purchase_units[0].payments.captures[0].id,
          },
          totalAmount: calculateTotalWithFees(),
          shippingAddress: shippingDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();
      toast.success("Order placed successfully!");
      clearCart();
      navigate("/success-payment");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (error) => {
    // Only handle non-window-closed errors here
    if (!error?.message?.includes("Window closed")) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.");
    }
    setIsProcessing(false);
  };

  if (isValidatingStock) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Validating product availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 space-y-8 max-w-4xl">
        <h1 className="text-3xl font-bold">Checkout</h1>

        {stockError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{stockError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                name="street"
                value={shippingDetails.street}
                onChange={handleInputChange}
                placeholder="Street address"
                required
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={shippingDetails.city}
                onChange={handleInputChange}
                placeholder="City"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                name="state"
                value={shippingDetails.state}
                onChange={handleInputChange}
                placeholder="State"
                required
              />
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP/Postal Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={shippingDetails.zipCode}
                onChange={handleInputChange}
                placeholder="ZIP Code"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={shippingDetails.country}
                onChange={handleInputChange}
                placeholder="Country"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={shippingDetails.phone}
                onChange={handleInputChange}
                placeholder="Phone Number"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₱{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Fee (2%)</span>
              <span>₱{(cartTotal * 0.02).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 mt-3"></div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>₱{calculateTotalWithFees().toFixed(2)}</span>
            </div>
          </div>

          {isProcessing ? (
            <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Processing payment...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {!isFormValid() ? (
                <Button className="w-full" disabled>
                  Please fill in all shipping details
                </Button>
              ) : (
                <PayPalButton
                  amount={calculateTotalWithFees()}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={isProcessing || !isFormValid() || stockError}
                />
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/cart")}
              >
                Back to Cart
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
