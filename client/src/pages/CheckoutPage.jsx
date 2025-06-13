import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { PayPalButton } from "@/components/PayPalButton";
import { toast } from "sonner";
import { Loader2, CreditCard, Banknote, Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart, removeFromCart } = useCart();

  // Get products from either cart or navigation state (Buy Now)
  const buyNowProducts = location.state?.products || [];
  const displayProducts =
    buyNowProducts.length > 0 ? buyNowProducts : cartItems;
  const isBuyNow = buyNowProducts.length > 0;

  // Calculate total for buy now products
  const buyNowTotal = buyNowProducts.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
  const displayTotal = isBuyNow ? buyNowTotal : cartTotal;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
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
        // Use the API function instead of direct fetch
        const deletedProducts = [];
        const stockChecks = await Promise.all(
          displayProducts.map(async (item) => {
            try {
              const response = await fetch(
                `${API_URL}/api/products/${item._id}`
              );
              if (!response.ok) {
                deletedProducts.push(item._id);
                return {
                  id: item._id,
                  name: item.name || "Unknown Product",
                  error: true,
                  message: "Product no longer available",
                };
              }
              const product = await response.json();
              return {
                id: item._id,
                name: product.name,
                available: product.quantity,
                requested: item.quantity,
                error: false,
              };
            } catch (error) {
              deletedProducts.push(item._id);
              return {
                id: item._id,
                name: item.name || "Unknown Product",
                error: true,
                message: "Error checking product",
              };
            }
          })
        );

        // Remove deleted products from cart (only if using cart, not buy now)
        if (!isBuyNow && deletedProducts.length > 0) {
          deletedProducts.forEach((id) => removeFromCart(id));
          toast.error(
            "Some items were removed from your cart as they are no longer available"
          );
        }

        const unavailableProducts = stockChecks.filter(
          (item) => item.error || item.requested > item.available
        );

        if (unavailableProducts.length > 0) {
          const errorMessages = unavailableProducts.map((item) =>
            item.error
              ? `${item.name} is no longer available`
              : `Insufficient stock for: ${item.name}`
          );
          setStockError(errorMessages.join(", "));
        }

        // If all products are unavailable
        if (deletedProducts.length === displayProducts.length) {
          if (isBuyNow) {
            navigate("/products");
            toast.error("The selected product is no longer available");
          } else {
            navigate("/cart");
            toast.error("All items in your cart are no longer available");
          }
          return;
        }
      } catch (error) {
        console.error("Error validating stock:", error);
        setStockError("Could not validate product availability");
      } finally {
        setIsValidatingStock(false);
      }
    };

    if (displayProducts.length > 0) {
      validateStock();
    }
  }, [displayProducts, removeFromCart, navigate, isBuyNow]);

  // Fetch saved addresses on component mount
  useEffect(() => {
    fetchSavedAddresses();
  }, []);

  const fetchSavedAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/user/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);

        // Auto-select default address if available
        const defaultAddress = addresses.find((addr) => addr.isDefault);
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress._id);
          setShippingDetails({
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country,
            phone: defaultAddress.phone,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleAddressSelection = (addressId) => {
    if (addressId === "new") {
      setUseNewAddress(true);
      setSelectedAddressId("");
      setShippingDetails({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
      });
    } else {
      const selectedAddress = savedAddresses.find(
        (addr) => addr._id === addressId
      );
      if (selectedAddress) {
        setUseNewAddress(false);
        setSelectedAddressId(addressId);
        setShippingDetails({
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          country: selectedAddress.country,
          phone: selectedAddress.phone,
        });
      }
    }
  };

  const saveAddressToProfile = async (addressData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch(`${API_URL}/api/user/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isFormValid = () => {
    return Object.values(shippingDetails).every(
      (value) => typeof value === "string" && value.trim() !== ""
    );
  };

  const calculateTotalWithFees = () => {
    const platformFee = displayTotal * 0.02; // 2% platform fee
    return displayTotal + platformFee;
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

      // Get the first seller from products (assuming single seller orders)
      const firstItem = displayProducts[0];
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
          items: displayProducts.map((item) => ({
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

      // Save address to profile if user checked the option
      if (saveNewAddress && (useNewAddress || savedAddresses.length === 0)) {
        await saveAddressToProfile(shippingDetails);
      }

      toast.success("Order placed successfully!");

      // Only clear cart if not using Buy Now
      if (!isBuyNow) {
        clearCart();
      }

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

  const handleCODOrder = async () => {
    try {
      setIsProcessing(true);
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Please login to complete your purchase");
        navigate("/login");
        return;
      }

      const firstItem = displayProducts[0];
      if (!firstItem?.seller?._id) {
        toast.error("Invalid seller information");
        return;
      }

      const totalAmount = calculateTotalWithFees();
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seller: firstItem.seller._id,
          items: displayProducts.map((item) => ({
            product: item._id,
            seller: item.seller._id,
            quantity: item.quantity,
            price: item.price,
          })),
          paymentInfo: {
            method: "paypal",
            status: "pending",
            transactionId: `COD-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,
            details: {
              codFee: 0,
              platformFee: displayTotal * 0.02,
              subtotal: displayTotal,
              total: totalAmount,
            },
          },
          totalAmount: totalAmount,
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

          {/* Address Selection */}
          {savedAddresses.length > 0 && (
            <div className="mb-6">
              <Label htmlFor="addressSelect">Choose Address</Label>
              <Select
                value={selectedAddressId || "new"}
                onValueChange={handleAddressSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved address" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((address) => (
                    <SelectItem key={address._id} value={address._id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {address.street}, {address.city}, {address.state}{" "}
                          {address.isDefault && "(Default)"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add new address</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Save New Address Checkbox - only show when adding new address */}
          {(useNewAddress || savedAddresses.length === 0) && (
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saveAddress"
                  checked={saveNewAddress}
                  onChange={(e) => setSaveNewAddress(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="saveAddress" className="text-sm">
                  Save this address to my profile
                </Label>
              </div>
            </div>
          )}

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
              <span>₱{displayTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Platform Fee (2%)</span>
              <span>₱{(displayTotal * 0.02).toFixed(2)}</span>
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
              <span>Processing order...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {!isFormValid() ? (
                <Button className="w-full" disabled>
                  Please fill in all shipping details
                </Button>
              ) : (
                <>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Payment Method
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-300 transition-colors ${
                          paymentMethod === "paypal"
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                            : "border-gray-200"
                        }`}
                      >
                        <CreditCard className="h-6 w-6 text-[#0070ba]" />
                        <span className="font-medium text-gray-900 text-sm">
                          PayPal
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-orange-300 transition-colors ${
                          paymentMethod === "cod"
                            ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                            : "border-gray-200"
                        }`}
                      >
                        <Banknote className="h-6 w-6 text-green-600" />
                        <span className="font-medium text-gray-900 text-sm">
                          Cash on Delivery
                        </span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === "paypal" ? (
                    <div className="rounded-lg overflow-hidden bg-[#f7f9fa] p-4">
                      <PayPalButton
                        amount={calculateTotalWithFees()}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        disabled={isProcessing || !isFormValid() || stockError}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          With Cash on Delivery, you can pay in cash when your
                          order arrives. A small COD fee may apply.
                        </p>
                      </div>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={handleCODOrder}
                        disabled={isProcessing || !isFormValid() || stockError}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Place Order with Cash on Delivery"
                        )}
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/cart")}
                  >
                    Back to Cart
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
