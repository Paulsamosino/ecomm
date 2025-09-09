import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { PayPalButton } from "@/components/PayPalButton";
import { getWallet } from "@/api/wallet";
import { toast } from "sonner";
import { Loader2, CreditCard, Banknote, Plus, MapPin, Truck } from "lucide-react";
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

// Constants
const PAYMENT_METHODS = [
  { value: "paypal", label: "PayPal", icon: CreditCard, color: "#0070ba" },
  { value: "wallet", label: "C&P Wallet", icon: Banknote, color: "#f59e0b" },
  { value: "cod", label: "Cash on Delivery", icon: Banknote, color: "#16a34a" },
  // GCASH is planned but not yet available
  { value: "gcash", label: "GCash (coming soon)", icon: Banknote, color: "#0ea5a4", comingSoon: true }
];

// Location data based on deliveryController geocoding with ZIP codes
const DELIVERY_LOCATIONS = {
  "Metro Manila": [
    { value: "manila", label: "Manila", zipCode: "1000" },
    { value: "quezon city", label: "Quezon City", zipCode: "1100" },
    { value: "makati", label: "Makati", zipCode: "1200" },
    { value: "taguig", label: "Taguig", zipCode: "1630" },
    { value: "pasig", label: "Pasig", zipCode: "1600" },
    { value: "mandaluyong", label: "Mandaluyong", zipCode: "1550" },
    { value: "parañaque", label: "Parañaque", zipCode: "1700" },
    { value: "las piñas", label: "Las Piñas", zipCode: "1740" },
    { value: "muntinlupa", label: "Muntinlupa", zipCode: "1770" },
    { value: "san juan", label: "San Juan", zipCode: "1500" },
    { value: "marikina", label: "Marikina", zipCode: "1800" },
    { value: "pasay", label: "Pasay", zipCode: "1300" },
    { value: "caloocan", label: "Caloocan", zipCode: "1400" },
    { value: "malabon", label: "Malabon", zipCode: "1470" },
    { value: "navotas", label: "Navotas", zipCode: "1485" },
    { value: "valenzuela", label: "Valenzuela", zipCode: "1440" },
    { value: "pateros", label: "Pateros", zipCode: "1620" }
  ],
  "Cavite": [
    { value: "cavite city", label: "Cavite City", zipCode: "4100" },
    { value: "bacoor", label: "Bacoor", zipCode: "4102" },
    { value: "imus", label: "Imus", zipCode: "4103" },
    { value: "dasmariñas", label: "Dasmariñas", zipCode: "4114" },
    { value: "general trias", label: "General Trias", zipCode: "4107" },
    { value: "kawit", label: "Kawit", zipCode: "4104" },
    { value: "noveleta", label: "Noveleta", zipCode: "4105" },
    { value: "rosario", label: "Rosario", zipCode: "4106" },
    { value: "silang", label: "Silang", zipCode: "4118" },
    { value: "carmona", label: "Carmona", zipCode: "4116" }
  ],
  "Laguna": [
    { value: "santa rosa", label: "Santa Rosa", zipCode: "4026" },
    { value: "biñan", label: "Biñan", zipCode: "4024" },
    { value: "san pedro", label: "San Pedro", zipCode: "4023" },
    { value: "calamba", label: "Calamba", zipCode: "4027" },
    { value: "los baños", label: "Los Baños", zipCode: "4030" },
    { value: "cabuyao", label: "Cabuyao", zipCode: "4025" },
    { value: "san pablo", label: "San Pablo", zipCode: "4000" },
    { value: "sta. cruz", label: "Sta. Cruz", zipCode: "4009" },
    { value: "pagsanjan", label: "Pagsanjan", zipCode: "4004" },
    { value: "calauan", label: "Calauan", zipCode: "4012" }
  ],
  "Batangas": [
    { value: "batangas city", label: "Batangas City", zipCode: "4200" },
    { value: "lipa", label: "Lipa", zipCode: "4217" },
    { value: "tanauan", label: "Tanauan", zipCode: "4232" },
    { value: "santo tomas", label: "Santo Tomas", zipCode: "4234" },
    { value: "malvar", label: "Malvar", zipCode: "4233" },
    { value: "lemery", label: "Lemery", zipCode: "4209" },
    { value: "taal", label: "Taal", zipCode: "4208" },
    { value: "nasugbu", label: "Nasugbu", zipCode: "4231" }
  ],
  "Rizal": [
    { value: "antipolo", label: "Antipolo", zipCode: "1870" },
    { value: "cainta", label: "Cainta", zipCode: "1900" },
    { value: "taytay", label: "Taytay", zipCode: "1920" },
    { value: "marikina", label: "Marikina", zipCode: "1800" },
    { value: "san mateo", label: "San Mateo", zipCode: "1850" },
    { value: "angono", label: "Angono", zipCode: "1930" },
    { value: "binangonan", label: "Binangonan", zipCode: "1940" },
    { value: "teresa", label: "Teresa", zipCode: "1880" },
    { value: "morong", label: "Morong", zipCode: "1960" }
  ]
};

const PROVINCES = Object.keys(DELIVERY_LOCATIONS).map(province => ({
  value: province,
  label: province
}));

// Utility functions
const formatPrice = (amount) => `₱${(amount || 0).toFixed(2)}`;
const formatPhone = (phone) => phone?.startsWith("+63") ? phone.substring(3) : phone || "";
const validatePhone = (digits) => {
  // digits parameter is now just the numeric digits without +63
  const digitString = digits?.toString() || "";
  return digitString.length === 10 ? "" : "Phone number must have exactly 10 digits.";
};

// Check if the selected city/province combination is supported for delivery
const isDeliverySupported = (city, province) => {
  if (!city || !province) return false;
  return DELIVERY_LOCATIONS[province]?.some(c => c.value === city.toLowerCase());
};

// Get delivery coverage message based on selection
const getDeliveryCoverageMessage = (city, province) => {
  if (!province) return "Please select a province to check delivery coverage.";
  if (!city) return "Please select a city to check delivery coverage.";
  
  return "";
};

// Custom hooks
const useFormValidation = (shippingDetails, phoneError, selectedAddressId, useNewAddress, savedAddresses) => {
  return useMemo(() => {
    if (savedAddresses.length > 0 && !useNewAddress && selectedAddressId) {
      // Check if selected address is in supported delivery area
      const selectedAddress = savedAddresses.find(addr => addr._id === selectedAddressId);
      if (selectedAddress) {
        return isDeliverySupported(selectedAddress.city, selectedAddress.state);
      }
      return true;
    }

    const { street, city, state, zipCode, country, phone } = shippingDetails;
    const allFieldsFilled = [street, city, state, zipCode, country].every(field => field?.trim());
    const isPhoneValid = !phoneError && phone?.length > 3;
    const isDeliveryAreaValid = isDeliverySupported(city, state);

    return allFieldsFilled && isPhoneValid && isDeliveryAreaValid;
  }, [shippingDetails, phoneError, selectedAddressId, useNewAddress, savedAddresses]);
};

const useOrderCalculations = (displayTotal, shippingFee) => {
  return useMemo(() => {
    const platformFee = displayTotal * 0.02;
    const total = displayTotal + platformFee + (shippingFee || 0);
    return { platformFee, total };
  }, [displayTotal, shippingFee]);
};

// Components
const AddressSelector = ({ savedAddresses, selectedAddressId, onAddressChange }) => {
  return (
    <div className="mb-6">
      <Label>Choose Delivery Address</Label>
      <Select value={selectedAddressId || "new"} onValueChange={onAddressChange}>
        <SelectTrigger>
          <SelectValue placeholder={savedAddresses.length > 0 ? "Select a saved address" : "Add new address"} />
        </SelectTrigger>
        <SelectContent>
          {savedAddresses.map((address) => (
            <SelectItem key={address._id} value={address._id}>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {address.street}, {address.city}, {address.state}
                  {address.isDefault && " (Default)"}
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
      {savedAddresses.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">
          You don't have any saved addresses yet. Add your first address below.
        </p>
      )}
    </div>
  );
};

const AddressForm = ({ 
  shippingDetails, 
  phoneError, 
  onInputChange, 
  showSaveOption, 
  saveNewAddress, 
  onSaveAddressChange 
}) => {
  const [availableCities, setAvailableCities] = useState([]);

  // Update available cities when province changes
  useEffect(() => {
    if (shippingDetails.state && DELIVERY_LOCATIONS[shippingDetails.state]) {
      setAvailableCities(DELIVERY_LOCATIONS[shippingDetails.state]);
      // Clear city and zipCode if current city is not available in the new province
      if (shippingDetails.city && !DELIVERY_LOCATIONS[shippingDetails.state].some(city => city.value === shippingDetails.city.toLowerCase())) {
        onInputChange({ target: { name: 'city', value: '' } });
        onInputChange({ target: { name: 'zipCode', value: '' } });
      }
    } else {
      setAvailableCities([]);
      // Clear city and zipCode when no province is selected
      if (shippingDetails.city) {
        onInputChange({ target: { name: 'city', value: '' } });
      }
      if (shippingDetails.zipCode) {
        onInputChange({ target: { name: 'zipCode', value: '' } });
      }
    }
  }, [shippingDetails.state, shippingDetails.city, shippingDetails.zipCode, onInputChange]);

  const deliveryCoverageMessage = getDeliveryCoverageMessage(shippingDetails.city, shippingDetails.state);
  const isDeliveryValid = isDeliverySupported(shippingDetails.city, shippingDetails.state);

  return (
    <>
      {showSaveOption && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="saveAddress"
              checked={saveNewAddress}
              onChange={(e) => onSaveAddressChange(e.target.checked)}
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
            onChange={onInputChange}
            placeholder="123 Main Street, Barangay"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Include house/unit number and barangay for accurate delivery
          </p>
        </div>
        
        <div>
          <Label htmlFor="state">Province/Region</Label>
          <Select 
            value={shippingDetails.state} 
            onValueChange={(value) => onInputChange({ target: { name: 'state', value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((province) => (
                <SelectItem key={province.value} value={province.value}>
                  {province.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            We deliver to Metro Manila and South Luzon provinces
          </p>
        </div>

        <div>
          <Label htmlFor="city">City/Municipality</Label>
          <Select 
            value={shippingDetails.city} 
            onValueChange={(value) => {
              // Find the selected city to get its ZIP code
              const selectedCity = availableCities.find(city => city.value === value);
              const zipCode = selectedCity?.zipCode || "";
              
              // Update both city and zipCode
              onInputChange({ target: { name: 'city', value } });
              if (zipCode) {
                onInputChange({ target: { name: 'zipCode', value: zipCode } });
              }
            }}
            disabled={!shippingDetails.state}
          >
            <SelectTrigger>
              <SelectValue placeholder={shippingDetails.state ? "Select city" : "Select province first"} />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!shippingDetails.state && (
            <p className="text-sm text-gray-500 mt-1">Please select a province first</p>
          )}
          {shippingDetails.state && shippingDetails.city && (
            <p className={`text-sm mt-1 ${isDeliveryValid ? 'text-green-600' : 'text-red-600'}`}>
              {deliveryCoverageMessage}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="zipCode">ZIP/Postal Code</Label>
          <Input
            id="zipCode"
            name="zipCode"
            value={shippingDetails.zipCode}
            onChange={onInputChange}
            placeholder="Auto-filled when city is selected"
            disabled={true}
            className="bg-gray-50 cursor-not-allowed"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Automatically populated based on selected city
          </p>
        </div>
        
        <div>
          <Label htmlFor="country">Country</Label>
          <Select 
            value={shippingDetails.country} 
            onValueChange={(value) => onInputChange({ target: { name: 'country', value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <div className={`flex items-center rounded-md border ${phoneError ? "border-red-500" : "border-input"} bg-white`}>
            <span className="pl-3 text-sm text-muted-foreground">+63</span>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9123456789"
              value={formatPhone(shippingDetails.phone)}
              onChange={onInputChange}
              className="w-full border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
              maxLength="10"
            />
          </div>
          {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
          <p className="text-xs text-gray-500 mt-1">
            10-digit mobile number for delivery updates
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">📍 Delivery Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Coverage:</strong> Metro Manila (NCR) and South Luzon provinces (Cavite, Laguna, Batangas, Rizal)</p>
          <p><strong>Shipping:</strong> Calculated based on distance from our Mandaluyong store</p>
          <p><strong>Vehicle Options:</strong> Choose the right vehicle type for your order size</p>
          <p><strong>Delivery Time:</strong> Same-day delivery available within coverage areas</p>
        </div>
      </div>
    </>
  );
};

const OrderSummary = ({ 
  displayTotal, 
  platformFee, 
  shippingFee, 
  total, 
  isFetchingShipping, 
  shippingError 
}) => {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{formatPrice(displayTotal)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Platform Fee (2%)</span>
        <span>{formatPrice(platformFee)}</span>
      </div>
      <div className="flex justify-between text-gray-600">
        <span>Shipping</span>
        {isFetchingShipping ? (
          <span className="text-blue-500">Calculating...</span>
        ) : shippingError ? (
          <span className="text-amber-500" title={shippingError}>
            {formatPrice(shippingFee || 50)}
          </span>
        ) : (
          <span>{shippingFee !== null ? formatPrice(shippingFee) : "-"}</span>
        )}
      </div>
      <div className="border-t border-gray-100 pt-3 mt-3"></div>
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
};

const PaymentMethodSelector = ({ paymentMethod, onPaymentMethodChange }) => (
  <div>
    <h3 className="font-medium text-gray-900 mb-3">Payment Method</h3>
    <div className="grid grid-cols-2 gap-3">
      {PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const isComing = method.comingSoon;
        return (
          <button
            key={method.value}
            type="button"
            onClick={() => { if (!isComing) onPaymentMethodChange(method.value); }}
            disabled={isComing}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-colors ${
              paymentMethod === method.value
                ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                : "border-gray-200"
            } ${isComing ? 'opacity-60 cursor-not-allowed' : 'hover:border-orange-300'}`}
          >
            <Icon className="h-6 w-6" style={{ color: method.color }} />
            <span className="font-medium text-gray-900 text-sm">{method.label}</span>
            {isComing && <span className="text-xs text-gray-500 mt-1">(coming soon)</span>}
          </button>
        );
      })}
    </div>
  </div>
);

const LoadingScreen = ({ message }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p>{message}</p>
    </div>
  </div>
);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart } = useCart();

  // Get products from either cart or navigation state (Buy Now)
  const buyNowProducts = location.state?.products || [];
  const displayProducts = buyNowProducts.length > 0 ? buyNowProducts : cartItems;
  const isBuyNow = buyNowProducts.length > 0;
  const buyNowTotal = buyNowProducts.reduce((total, product) => total + product.price * product.quantity, 0);
  const displayTotal = isBuyNow ? buyNowTotal : cartTotal;

  // State management
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState({ balance: 0, currency: "PHP" });
  const [isFetchingWallet, setIsFetchingWallet] = useState(false);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [useNewAddress, setUseNewAddress] = useState(true);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [shippingDetails, setShippingDetails] = useState({
    street: "", city: "", state: "", zipCode: "", country: "", phone: "",
  });
  const [shippingFee, setShippingFee] = useState(null);
  const [isFetchingShipping, setIsFetchingShipping] = useState(false);
  const [shippingError, setShippingError] = useState(null);

  // Custom hooks
  const isFormValid = useFormValidation(shippingDetails, phoneError, selectedAddressId, useNewAddress, savedAddresses);
  const { platformFee, total } = useOrderCalculations(displayTotal, shippingFee);

  // Event handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      // Limit to 10 digits max
      const limitedDigits = digitsOnly.slice(0, 10);
      const formattedPhone = limitedDigits ? `+63${limitedDigits}` : "";
      setShippingDetails(prev => ({ ...prev, phone: formattedPhone }));
      // Validate using only the digits part (not the +63 prefix)
      setPhoneError(validatePhone(limitedDigits));
    } else {
      setShippingDetails(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleAddressSelection = useCallback((addressId) => {
    if (addressId === "new") {
      setUseNewAddress(true);
      setSelectedAddressId("");
      setShippingDetails({
        street: "", city: "", state: "", zipCode: "", country: "", phone: "",
      });
      setPhoneError("");
    } else {
      const selectedAddress = savedAddresses.find(addr => addr._id === addressId);
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
        // Validate the phone number from saved address
        const digits = selectedAddress.phone?.startsWith("+63") 
          ? selectedAddress.phone.substring(3).replace(/\D/g, "")
          : selectedAddress.phone?.replace(/\D/g, "") || "";
        setPhoneError(validatePhone(digits));
      }
    }
  }, [savedAddresses]);

  // API calls
  const fetchSavedAddresses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/user/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);

        const defaultAddress = addresses.find(addr => addr.isDefault);
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress._id);
          setUseNewAddress(false); // Use saved address instead of new address form
          setShippingDetails({
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zipCode: defaultAddress.zipCode,
            country: defaultAddress.country,
            phone: defaultAddress.phone,
          });
          // Validate the phone number from default address
          const digits = defaultAddress.phone?.startsWith("+63")
            ? defaultAddress.phone.substring(3).replace(/\D/g, "")
            : defaultAddress.phone?.replace(/\D/g, "") || "";
          setPhoneError(validatePhone(digits));
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }, [selectedAddressId]);

  const validateStock = useCallback(async () => {
    setIsValidatingStock(true);
    setStockError(null);

    try {
      const stockChecks = await Promise.all(
        displayProducts.map(async (item) => {
          try {
            const response = await fetch(`${API_URL}/api/products/${item._id}`);
            if (!response.ok) {
              return { id: item._id, name: item.name || "Unknown Product", error: true };
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
            return { id: item._id, name: item.name || "Unknown Product", error: true };
          }
        })
      );

      const issues = stockChecks.filter(item => item.error || item.requested > item.available);
      if (issues.length > 0) {
        setStockError(issues.map(item => 
          item.error ? `${item.name} is unavailable` : `Insufficient stock for ${item.name}`
        ).join(", "));
      }
    } catch (error) {
      setStockError("Could not validate product availability");
    } finally {
      setIsValidatingStock(false);
    }
  }, [displayProducts]);

  const fetchShippingFee = useCallback(async () => {
    setIsFetchingShipping(true);
    setShippingError(null);
    
    try {
      // Get seller ID from the first item (assuming all items are from the same seller)
      const sellerId = displayProducts[0]?.seller?._id;
      
      const response = await fetch(`${API_URL}/api/delivery/quote`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          vehicleType: "MOTORCYCLE", // Default vehicle type
          sellerId, // Include seller ID for pickup location
          dropoff: {
            ...shippingDetails,
            fullAddress: `${shippingDetails.street}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`
          },
        }),
      });
      
      if (!response.ok) throw new Error("Failed to get shipping quote");
      
      const data = await response.json();
      const fee = data.fee || data.price || 0;
      setShippingFee(fee);
      
      if (fee === 0) {
        setShippingError("Unable to calculate shipping fee. Please verify your address.");
      }
    } catch (err) {
      setShippingError("Could not fetch shipping fee for this location");
      setShippingFee(50); // Fallback
    } finally {
      setIsFetchingShipping(false);
    }
  }, [shippingDetails, displayProducts]);

  const saveAddressToProfile = useCallback(async (addressData) => {
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
  }, []);

  const createOrder = useCallback(async (orderData) => {
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
        totalAmount: total,
        shippingAddress: shippingDetails,
        delivery: { vehicleType: "MOTORCYCLE", shippingFee: shippingFee || 0 },
        ...orderData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create order");
    }

    if (saveNewAddress && (useNewAddress || savedAddresses.length === 0)) {
      await saveAddressToProfile(shippingDetails);
    }

    toast.success("Order placed successfully!");
    if (!isBuyNow) clearCart();
    navigate("/success-payment");
  }, [displayProducts, total, shippingDetails, shippingFee, saveNewAddress, useNewAddress, savedAddresses, saveAddressToProfile, isBuyNow, clearCart, navigate]);

  const handlePaymentSuccess = useCallback(async (order) => {
    try {
      setIsProcessing(true);
      await createOrder({
        paymentInfo: {
          method: "paypal",
          status: "completed",
          transactionId: order.purchase_units[0].payments.captures[0].id,
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [createOrder]);

  const handleCODOrder = useCallback(async () => {
    try {
      setIsProcessing(true);
      await createOrder({
        paymentInfo: {
          method: "cod",
          status: "pending",
          transactionId: `COD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          details: { codFee: 0, platformFee, subtotal: displayTotal, total },
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [createOrder, platformFee, displayTotal, total]);

  const handleWalletOrder = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Ensure wallet balance up-to-date
  const w = await getWallet();
  setWallet(w || { balance: 0, currency: "PHP" });

      if ((w?.balance || 0) < total) {
        toast.error("Insufficient wallet balance. Please top up your wallet.");
        return;
      }

      const txId = `WALLET-${Date.now()}`;

      await createOrder({
        paymentInfo: {
          method: "wallet",
          status: "completed",
          transactionId: txId,
        },
      });
    } catch (error) {
      console.error("Error creating wallet order:", error);
      toast.error(error.message || "Failed to place order with wallet. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [createOrder, total]);

  // Fetch wallet balance when the user selects Wallet or on mount (if logged in)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (paymentMethod !== "wallet") return;
        setIsFetchingWallet(true);
        const w = await getWallet();
        if (!mounted) return;
        setWallet(w || { balance: 0, currency: "PHP" });
      } catch (err) {
        console.error("Failed to fetch wallet:", err);
        toast.error("Could not load wallet balance");
      } finally {
        setIsFetchingWallet(false);
      }
    };

    // Only attempt if user is logged in
    if (localStorage.getItem("token")) {
      load();
    }

    return () => { mounted = false; };
  }, [paymentMethod]);

  // ...existing code...

  const handlePaymentError = useCallback((error) => {
    if (!error?.message?.includes("Window closed")) {
      toast.error("Payment failed. Please try again.");
    }
    setIsProcessing(false);
  }, []);

  // Effects
  useEffect(() => {
    if (displayProducts.length > 0) {
      validateStock();
    }
  }, [validateStock, displayProducts.length]);

  useEffect(() => {
    fetchSavedAddresses();
  }, [fetchSavedAddresses]);

  useEffect(() => {
    if (Object.values(shippingDetails).every(field => field?.trim())) {
      fetchShippingFee();
    } else {
      setShippingFee(null);
    }
  }, [fetchShippingFee, shippingDetails]);

  // Loading screen
  if (isValidatingStock) {
    return <LoadingScreen message="Validating product availability..." />;
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

          <AddressSelector 
            savedAddresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onAddressChange={handleAddressSelection}
          />

          <AddressForm 
            shippingDetails={shippingDetails}
            phoneError={phoneError}
            onInputChange={handleInputChange}
            showSaveOption={useNewAddress || savedAddresses.length === 0}
            saveNewAddress={saveNewAddress}
            onSaveAddressChange={setSaveNewAddress}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          <div className="divide-y divide-gray-100 mb-4">
            {displayProducts.map((item) => (
              <div key={item._id || item.product} className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-50 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={item.images?.[0] || item.images || "/1f425.png"}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = "/1f425.png"; }}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      {item.seller && (
                        <p className="text-sm text-gray-500">Seller: {item.seller.name || "Unknown Seller"}</p>
                      )}
                      {(item.warrantyPeriod || item.warrantyDetails) && (
                        <div className="mt-2 text-sm text-gray-600">
                          {item.warrantyPeriod && (
                            <div>Warranty: <span className="font-medium">{item.warrantyPeriod}</span></div>
                          )}
                          {item.warrantyDetails && (
                            <div className="mt-1">{item.warrantyDetails}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">₱{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <OrderSummary
              displayTotal={displayTotal}
              platformFee={platformFee}
              shippingFee={shippingFee}
              total={total}
              isFetchingShipping={isFetchingShipping}
              shippingError={shippingError}
            />

          {isProcessing ? (
            <div className="flex items-center justify-center p-4 border rounded-lg bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span>Processing order...</span>
            </div>
          ) : !isFormValid ? (
            <Button className="w-full" disabled>
              {shippingDetails.city && shippingDetails.state && !isDeliverySupported(shippingDetails.city, shippingDetails.state)
                ? "Delivery not available in selected area"
                : "Please fill in all shipping details"}
            </Button>
          ) : (
            <div className="space-y-6">
              <PaymentMethodSelector 
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />

              {paymentMethod === "paypal" ? (
                <div className="rounded-lg overflow-hidden bg-[#f7f9fa] p-4">
                  <PayPalButton
                    amount={total}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    disabled={isProcessing || !isFormValid || stockError}
                  />
                </div>
              ) : paymentMethod === "wallet" ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Use your wallet balance to pay for this order.</p>
                    <p className="text-lg font-semibold mt-2">Balance: {isFetchingWallet ? 'Loading...' : `₱ ${Number(wallet.balance || 0).toLocaleString()}`}</p>
                    {(!isFetchingWallet && (wallet.balance || 0) < total) && (
                      <p className="mt-2 text-sm text-red-600">Insufficient balance to pay ₱{total.toFixed(2)}. Please top up your wallet.</p>
                    )}
                  </div>
                  <div className="grid gap-3">
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleWalletOrder}
                      disabled={isProcessing || !isFormValid || stockError || isFetchingWallet || (wallet.balance || 0) < total}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Pay with Wallet"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/buyer-dashboard/wallet')}
                    >
                      Top up wallet
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      With Cash on Delivery, you can pay in cash when your order arrives.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleCODOrder}
                    disabled={isProcessing || !isFormValid || stockError}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
