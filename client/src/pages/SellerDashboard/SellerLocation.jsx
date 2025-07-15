import React, { useState, useEffect } from "react";
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

// Import the same delivery locations used in checkout
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

const SellerLocation = () => {
  const [location, setLocation] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
    phone: "",
  });
  const [availableCities, setAvailableCities] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    // Fetch seller location from API (if exists)
    const fetchLocation = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/seller/location`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Ensure all fields are strings to prevent controlled/uncontrolled warnings
          setLocation({
            street: data.street || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
            country: data.country || "Philippines",
            phone: data.phone || "",
          });
        }
      } catch (err) {
        // ignore
      }
    };
    fetchLocation();
  }, []);

  // Update available cities when province changes
  useEffect(() => {
    if (location.state && DELIVERY_LOCATIONS[location.state]) {
      setAvailableCities(DELIVERY_LOCATIONS[location.state]);
      // Clear city and zipCode if current city is not available in the new province
      if (location.city && !DELIVERY_LOCATIONS[location.state].some(city => city.value === location.city.toLowerCase())) {
        setLocation(prev => ({ ...prev, city: '', zipCode: '' }));
      }
    } else {
      setAvailableCities([]);
      // Clear city and zipCode when no province is selected
      if (location.city) {
        setLocation(prev => ({ ...prev, city: '' }));
      }
      if (location.zipCode) {
        setLocation(prev => ({ ...prev, zipCode: '' }));
      }
    }
  }, [location.state, location.city, location.zipCode]);

  const handleChange = (e) => {
    setLocation((prev) => ({ 
      ...prev, 
      [e.target.name]: e.target.value || "" 
    }));
  };

  const handleSelectChange = (name, value) => {
    if (name === 'city') {
      // Find the selected city to get its ZIP code
      const selectedCity = availableCities.find(city => city.value === value);
      const zipCode = selectedCity?.zipCode || "";
      
      // Update both city and zipCode, ensure strings
      setLocation(prev => ({ 
        ...prev, 
        city: value || "", 
        zipCode: zipCode || "" 
      }));
    } else {
      setLocation(prev => ({ 
        ...prev, 
        [name]: value || "" 
      }));
    }
  };

  const formatPhone = (phone) => phone?.startsWith("+63") ? phone.substring(3) : phone || "";

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 10 characters
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setLocation(prev => ({ ...prev, phone: `+63${digits}` }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/seller/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(location),
      });
      if (!res.ok) throw new Error("Failed to save location");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isDeliverySupported = location.city && location.state && DELIVERY_LOCATIONS[location.state]?.some(c => c.value === location.city.toLowerCase());

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">Change Location</h2>
      <p className="text-gray-600 mb-6">
        Update your store location for order pickups and deliveries.
      </p>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            name="street"
            value={location.street}
            onChange={handleChange}
            placeholder="123 Main Street, Barangay"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Include building number, street name, and barangay
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">Province/Region</Label>
            <Select 
              value={location.state} 
              onValueChange={(value) => handleSelectChange('state', value)}
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
              Metro Manila and South Luzon provinces supported
            </p>
          </div>

          <div>
            <Label htmlFor="city">City/Municipality</Label>
            <Select 
              value={location.city} 
              onValueChange={(value) => handleSelectChange('city', value)}
              disabled={!location.state}
            >
              <SelectTrigger>
                <SelectValue placeholder={location.state ? "Select city" : "Select province first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCities.map((city) => (
                  <SelectItem key={city.value} value={city.value}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!location.state && (
              <p className="text-sm text-gray-500 mt-1">Please select a province first</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={location.zipCode}
              placeholder="Auto-filled when city is selected"
              disabled={true}
              className="bg-gray-50 cursor-not-allowed"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-populated based on selected city
            </p>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Select 
              value={location.country} 
              onValueChange={(value) => handleSelectChange('country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Philippines">🇵🇭 Philippines</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Contact Phone Number</Label>
          <div className="flex items-center rounded-md border border-input bg-white">
            <span className="pl-3 text-sm text-muted-foreground">+63</span>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="9123456789"
              value={formatPhone(location.phone)}
              onChange={handlePhoneChange}
              className="w-full border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
              maxLength="10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            10-digit mobile number for coordination
          </p>
        </div>

        {isDeliverySupported && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">✅ Delivery Available</h4>
            <p className="text-sm text-green-700">
              Your location supports delivery services.
            </p>
          </div>
        )}

        {location.state && location.city && !isDeliverySupported && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Limited Delivery</h4>
            <p className="text-sm text-amber-700">
              Limited delivery options available for your location.
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📍 Delivery Information</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Coverage:</strong> Metro Manila and South Luzon provinces</p>
            <p><strong>Pickup:</strong> Orders collected from this location</p>
            <p><strong>Contact:</strong> Phone number used for coordination</p>
          </div>
        </div>

        {error && <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm p-3 bg-green-50 border border-green-200 rounded">
            Location updated successfully!
          </div>
        )}
        
        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Store Location"}
        </Button>
      </form>
    </div>
  );
};

export default SellerLocation;
