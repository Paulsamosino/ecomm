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
import { validateVoucher as apiValidateVoucher } from '@/api/vouchers';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Local storage key used by Inventory page to show recent purchases
const RECENT_KEY = "recent_purchases_v1";

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

const useOrderCalculations = (items = [], appliedVoucher = null, shippingFee) => {
  return useMemo(() => {
    const round2 = (n) => Math.round((n || 0) * 100) / 100;

    // Compute raw subtotal from items (price * quantity)
    const subtotal = (items || []).reduce((s, it) => s + ((it.price || 0) * (it.quantity || 0)), 0);

    // Voucher discount (ensure numeric)
    const discountAmount = (appliedVoucher && typeof appliedVoucher.discount === 'number') ? appliedVoucher.discount : 0;

    // Apply voucher first, but don't allow negative adjusted subtotal
    const adjustedSubtotal = Math.max(0, subtotal - discountAmount);

    // Platform fee: mirror BuyerMyPurchase logic — compute from raw subtotal (not adjusted subtotal)
    // If in the future the server provides a platform fee value, prefer that (caller can pass it in if needed)
    const platformFee = round2(subtotal * 0.02);

    // Shipping (if null treat as 0 for computation)
    const shipping = typeof shippingFee === 'number' ? shippingFee : 0;

    // Total payable = adjusted subtotal (after voucher) + platform fee (based on raw subtotal) + shipping
    const total = round2(adjustedSubtotal + platformFee + shipping);

    return {
      subtotal: round2(subtotal),
      adjustedSubtotal: round2(adjustedSubtotal),
      platformFee,
      shippingFee: shipping,
      discountAmount,
      total,
    };
  }, [items, appliedVoucher, shippingFee]);
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
  discount = 0,
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
            {shippingError || "Unable to calculate shipping"}
          </span>
        ) : (
          <span>{shippingFee !== null ? formatPrice(shippingFee) : "-"}</span>
        )}
      </div>
      {typeof discount === 'number' && discount > 0 && (
        <div className="flex justify-between text-sm text-green-700">
          <span>Discount</span>
          <span>-{formatPrice(discount)}</span>
        </div>
      )}
      <div className="border-t border-gray-100 pt-3 mt-3"></div>
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
};

// --- Voucher helpers within checkout page ---


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
  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState(null);

  // Custom hooks
  const isFormValid = useFormValidation(shippingDetails, phoneError, selectedAddressId, useNewAddress, savedAddresses);

  // Recompute order calculations from the actual items so we mirror BuyerMyPurchase logic
  const {
    subtotal,
    adjustedSubtotal,
    platformFee,
    shippingFee: computedShippingFee,
    discountAmount,
    total,
  } = useOrderCalculations(displayProducts, appliedVoucher, shippingFee);

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

  // Robust recursive extractor for shipping fee from provider responses
  const extractShippingFee = (q) => {
    if (q === null || q === undefined) return null;

    // Helper: prefer positive (>0) values and only accept 0 if nothing else found
    if (Array.isArray(q)) {
      let zeroFound = false;
      for (const item of q) {
        const v = extractShippingFee(item);
        if (v !== null && Number.isFinite(v) && v > 0) return v;
        if (v === 0) zeroFound = true;
      }
      return zeroFound ? 0 : null;
    }

    if (typeof q === 'number' && Number.isFinite(q)) return q;

    if (typeof q === 'string') {
      const n = parseFloat(q.replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(n) ? n : null;
    }

    if (typeof q === 'object') {
      // If there's a priceBreakdown with a total, prefer that (many providers include it)
      if (q.priceBreakdown && (q.priceBreakdown.total || q.priceBreakdown.totalBeforeOptimization)) {
        const pb = q.priceBreakdown;
        const candidates = [pb.total, pb.totalBeforeOptimization, pb.totalExcludePriorityFee, pb.totalBeforeOptimization];
        for (const c of candidates) {
          if (c !== undefined && c !== null) {
            const parsed = extractShippingFee(c);
            if (parsed !== null && Number.isFinite(parsed) && parsed > 0) return parsed;
          }
        }
      }

      const tryKeys = ['total', 'totalFee', 'price', 'amount', 'cost', 'deliveryFee', 'shippingFee', 'fee'];
      let zeroFound = false;
      for (const k of tryKeys) {
        if (k in q) {
          const found = extractShippingFee(q[k]);
          if (found !== null && Number.isFinite(found) && found > 0) return found;
          if (found === 0) zeroFound = true;
        }
      }

      // Fallback: search any nested values for a positive fee
      for (const val of Object.values(q)) {
        const found = extractShippingFee(val);
        if (found !== null && Number.isFinite(found) && found > 0) return found;
        if (found === 0) zeroFound = true;
      }

      return zeroFound ? 0 : null;
    }

    return null;
  };

  // Fetch shipping quote and set shippingFee state (now tolerant to response shapes)
  const fetchShippingFee = useCallback(async () => {
  setIsFetchingShipping(true);
  setShippingError(null);

    try {
      if (!displayProducts || displayProducts.length === 0) {
        setShippingFee(null);
        return;
      }

      // Prepare payload for quote
      const first = displayProducts[0] || {};
      const sellerId = first?.seller?._id || first?.seller || null;

      // Server expects { vehicleType, sellerId, dropoff: { street, city, state, zipCode, country, phone, fullAddress } }
      const fullAddress = shippingDetails.fullAddress || `${shippingDetails.street}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`;
      const payload = {
        vehicleType: 'MOTORCYCLE',
        sellerId,
        dropoff: {
          street: shippingDetails.street,
          city: shippingDetails.city,
          state: shippingDetails.state,
          zipCode: shippingDetails.zipCode,
          country: shippingDetails.country,
          phone: shippingDetails.phone,
          fullAddress,
          name: shippingDetails.name || undefined,
        },
        // Keep items for server-side debugging or future use
        items: displayProducts.map((p) => ({ productId: p._id || p.product?._id || p.productId, quantity: p.quantity || 1 })),
        // include full shippingDetails for server-side debugging if needed
        rawShipping: shippingDetails,
      };

    console.debug('Fetching shipping quote', payload);

      const response = await fetch(`${API_URL}/api/delivery/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // read raw text so we can handle both JSON error bodies and non-JSON responses
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }

    console.debug('Delivery quote HTTP', { status: response.status, statusText: response.statusText, data });

      if (!response.ok) {
        const message = (data && typeof data === 'object' && data.message) ? data.message : (typeof data === 'string' ? data : JSON.stringify(data));
        const short = String(message).slice(0, 500);
        setShippingFee(null);
        setShippingError(`Delivery quote failed (${response.status}): ${short}`);
        console.error('Delivery quote error', response.status, response.statusText, data);
        return;
      }

    const feeRaw = extractShippingFee(data);
      const fee = Number.isFinite(Number(feeRaw)) ? Math.round(Number(feeRaw) * 100) / 100 : null;
      console.debug('Shipping quote response', { data, feeRaw, fee });

      // Treat null/NaN and zero as invalid quote (0 often indicates a failed quote)
      if (fee !== null && Number.isFinite(fee) && fee > 0) {
        setShippingFee(fee);
        setShippingError(null);
      } else {
        setShippingFee(null);
        const short = JSON.stringify(data, Object.keys(data || {}).slice(0, 5)).slice(0, 500);
        setShippingError(fee === 0 ? 'Unable to calculate shipping fee (received 0). Please verify your address.' : `Unable to calculate shipping fee. Response: ${short}`);
      }
      // no-op: finished fetching
    } catch (err) {
      console.error('Error fetching shipping fee', err);
      setShippingError(err.message || 'Could not fetch shipping fee for this location');
      setShippingFee(null);
    } finally {
      setIsFetchingShipping(false);
    }
  }, [shippingDetails, displayProducts]);
  

  // Only trigger fetchShippingFee when the shipping details are all present (robust for non-strings)
  useEffect(() => {
    const allFilled = Object.values(shippingDetails).every((field) => {
      if (field === null || field === undefined) return false;
      return String(field).trim().length > 0;
    });

    if (allFilled) {
      fetchShippingFee();
    } else {
      setShippingFee(null);
    }
  }, [fetchShippingFee, shippingDetails]);

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

  // When creating the order, always send a numeric shipping fee rounded to 2 decimals
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

    try {
      setIsProcessing(true);

      const shippingFeePayload = Number.isFinite(Number(shippingFee)) ? Math.round(Number(shippingFee) * 100) / 100 : 0;

      // Build items payload expected by server (server expects `product` and `seller` keys)
      const itemsPayload = (displayProducts || []).map(p => ({
        product: p._id || p.product?._id || p.productId,
        quantity: p.quantity || 1,
        price: p.price || (p.product && p.product.price) || 0,
        seller: p.seller?._id || p.seller || null,
      }));

      if (!itemsPayload || itemsPayload.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      // Build shippingAddress expected by server
      const shippingAddress = {
        street: shippingDetails.street || '',
        city: shippingDetails.city || '',
        state: shippingDetails.state || '',
        zipCode: shippingDetails.zipCode || '',
        country: shippingDetails.country || '',
        phone: shippingDetails.phone || '',
        fullAddress: shippingDetails.fullAddress || `${shippingDetails.street}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`
      };

      // Client-side guard: match server's required shipping fields
      if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country || !shippingAddress.phone) {
        const msg = 'Please complete your shipping address before placing an order.';
        toast.error(msg);
        throw new Error(msg);
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...orderData,
          voucherCode: appliedVoucher?.voucher?.code || voucherCode || undefined,
          delivery: { vehicleType: 'MOTORCYCLE', shippingFee: shippingFeePayload },
          items: itemsPayload,
          sellerId: itemsPayload[0]?.seller || undefined,
          shippingAddress,
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
      // Persist a lightweight recent purchases list to localStorage so Inventory page can offer quick-add
      try {
        const recent = (displayProducts || []).map(p => ({
          name: p.name || (p.product && p.product.name) || 'Item',
          qty: p.quantity || 1,
          category: p.category || (p.product && p.product.category) || undefined,
        }));
        localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
      } catch (e) {
        // ignore storage errors
        console.warn('Failed to save recent purchases to localStorage', e);
      }

      if (!isBuyNow) clearCart();
      navigate("/success-payment");
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error(err.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [shippingFee, appliedVoucher, voucherCode]);

  // Voucher actions
  const applyVoucher = useCallback(async () => {
    if (!voucherCode) return toast.error('Enter voucher code');
    setIsValidatingVoucher(true);
    setVoucherError(null);
    try {
      // Validate voucher against the items subtotal (not including platform fee / shipping)
      const res = await apiValidateVoucher(voucherCode, subtotal);
      setAppliedVoucher(res);
      localStorage.setItem('appliedVoucher', JSON.stringify(res));
      toast.success(`Voucher applied: -₱${res.discount.toFixed(2)}`);
    } catch (err) {
      console.error('Voucher validation failed', err);
      setAppliedVoucher(null);
      localStorage.removeItem('appliedVoucher');
      const msg = err?.message || 'Invalid voucher';
      setVoucherError(msg);
      toast.error(msg);
    } finally {
      setIsValidatingVoucher(false);
    }
  }, [voucherCode, subtotal]);

  const clearVoucher = useCallback(() => {
    setVoucherCode("");
    setAppliedVoucher(null);
    setVoucherError(null);
    localStorage.removeItem('appliedVoucher');
    toast.success('Voucher cleared');
  }, []);

  const handlePaymentSuccess = useCallback(async (order) => {
    try {
      setIsProcessing(true);
      await createOrder({
          paymentInfo: {
            method: "paypal",
            status: "completed",
            transactionId: order.purchase_units[0].payments.captures[0].id,
            details: { subtotal: adjustedSubtotal, platformFee, total }
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
          // Use adjusted subtotal (items after voucher) so server and order management see the same values
    details: { codFee: 0, platformFee, subtotal: adjustedSubtotal, total },
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.message || "Failed to create order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [createOrder, platformFee, adjustedSubtotal, total]);

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
          details: { subtotal: adjustedSubtotal, platformFee, total }
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

  // Load voucher saved from navbar (persisted in localStorage)
  useEffect(() => {
    const stored = localStorage.getItem("appliedVoucher");
    if (stored) {
      try {
        const v = JSON.parse(stored);
        setAppliedVoucher(v);
        setVoucherCode(v?.voucher?.code || "");
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

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
              displayTotal={subtotal}
              platformFee={platformFee}
              shippingFee={computedShippingFee}
              discount={discountAmount ?? 0}
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

                {/* Voucher input */}
                <div className="mt-4 p-4 border rounded-lg bg-white">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Have a voucher code?</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter voucher code"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={applyVoucher} disabled={isValidatingVoucher}>
                      {isValidatingVoucher ? <Loader2 className="animate-spin" /> : 'Apply'}
                    </Button>
                    <Button variant="outline" onClick={clearVoucher}>Clear</Button>
                  </div>

                  {voucherError && (
                    <div className="mt-2 text-sm text-red-600">
                      {voucherError}
                    </div>
                  )}

                  {appliedVoucher && (
                    <div className="mt-3 text-sm text-green-700">
                      <div>Applied: <strong>{appliedVoucher.voucher.code}</strong></div>
                      <div>Discount: <strong>₱{(appliedVoucher.discount || 0).toFixed(2)}</strong></div>
                      <div>Final total: <strong>{formatPrice(total)}</strong></div>
                    </div>
                  )}
                </div>

              {paymentMethod === "paypal" ? (
                <div className="rounded-lg overflow-hidden bg-[#f7f9fa] p-4">
                  <PayPalButton
                    amount={total}
                    recentItems={displayProducts}
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
