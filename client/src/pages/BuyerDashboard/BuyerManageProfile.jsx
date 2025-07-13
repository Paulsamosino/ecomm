import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, MapPin, Camera, CheckCircle, AlertCircle } from "lucide-react";
import ProfilePictureUpload from "@/components/ui/ProfilePictureUpload";

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

// Utility functions
const isDeliverySupported = (city, province) => {
  if (!city || !province) return false;
  return DELIVERY_LOCATIONS[province]?.some(c => c.value === city.toLowerCase());
};

const formatPhone = (phone) => phone?.startsWith("+63") ? phone.substring(3) : phone || "";

const BuyerManageProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
    phone: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Update available cities when province changes
  useEffect(() => {
    if (newAddress.state && DELIVERY_LOCATIONS[newAddress.state]) {
      setAvailableCities(DELIVERY_LOCATIONS[newAddress.state]);
      // Clear city and zipCode if current city is not available in the new province
      if (newAddress.city && !DELIVERY_LOCATIONS[newAddress.state].some(city => city.value === newAddress.city.toLowerCase())) {
        setNewAddress(prev => ({ ...prev, city: '', zipCode: '' }));
      }
    } else {
      setAvailableCities([]);
      // Clear city and zipCode when no province is selected
      if (newAddress.city) {
        setNewAddress(prev => ({ ...prev, city: '' }));
      }
      if (newAddress.zipCode) {
        setNewAddress(prev => ({ ...prev, zipCode: '' }));
      }
    }
  }, [newAddress.state, newAddress.city, newAddress.zipCode]);

  const fetchUserProfile = async () => {
    try {
      const userResponse = await axiosInstance.get("/user/profile");
      const addressesResponse = await axiosInstance.get("/user/addresses");

      const { name, email, phone } = userResponse.data;
      setPersonalInfo({
        name: name || "",
        email: email || "",
        phone: phone || "",
      });

      // Ensure we're getting the addresses array correctly
      if (Array.isArray(addressesResponse.data)) {
        setAddresses(addressesResponse.data);
      } else if (Array.isArray(addressesResponse.data.addresses)) {
        setAddresses(addressesResponse.data.addresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile information");
      setAddresses([]); // Set empty array on error
    }
  };

  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put("/user/profile", personalInfo);
      updateUser(response.data);
      toast.success("Personal information updated successfully");
    } catch (error) {
      toast.error("Failed to update personal information");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (name, value) => {
    if (name === 'city') {
      // Find the selected city to get its ZIP code
      const selectedCity = availableCities.find(city => city.value === value);
      const zipCode = selectedCity?.zipCode || "";
      
      // Update both city and zipCode
      setNewAddress(prev => ({ ...prev, city: value, zipCode }));
    } else {
      setNewAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and limit to 10 characters
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setNewAddress(prev => ({ ...prev, phone: `+63${digits}` }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (
      !newAddress.street ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zipCode ||
      !newAddress.country
    ) {
      toast.error("Please fill in all required address fields");
      return;
    }

    // Validate phone number if provided
    if (newAddress.phone) {
      if (!newAddress.phone.startsWith("+63")) {
        toast.error("Please enter a valid Philippine phone number");
        return;
      }
      
      // Extract digits after +63 and validate
      const digits = newAddress.phone.substring(3);
      if (digits.length !== 10 || !digits.startsWith("9")) {
        toast.error("Please enter a valid 10-digit Philippine mobile number starting with 9");
        return;
      }
    }

    // Check if delivery is supported
    if (!isDeliverySupported(newAddress.city, newAddress.state)) {
      toast.error("This location is not supported for delivery. Please select a location within our coverage area.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/user/addresses", newAddress);

      // Update addresses state with the new address
      if (response.data.addresses) {
        setAddresses(response.data.addresses);
      } else if (response.data) {
        // If the response contains just the new address, add it to existing addresses
        setAddresses((prev) => [...prev, response.data]);
      }

      // Reset the form
      setNewAddress({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Philippines",
        phone: "",
        isDefault: false,
      });
      setAvailableCities([]);

      toast.success("Address added successfully");
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error(error.response?.data?.message || "Failed to add address");
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      await axiosInstance.delete(`/user/addresses/${addressId}`);
      // Fetch the updated addresses list after deletion
      await fetchUserProfile();
      toast.success("Address deleted successfully");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.response?.data?.message || "Failed to delete address");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Manage Profile</h2>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger key="picture" value="picture">
            <Camera className="h-4 w-4 mr-2" />
            Profile Picture
          </TabsTrigger>
          <TabsTrigger key="personal" value="personal">
            <User className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger key="addresses" value="addresses">
            <MapPin className="h-4 w-4 mr-2" />
            Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent key="picture-content" value="picture">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                Upload or change your profile picture to personalize your
                account.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProfilePictureUpload
                currentImage={user?.profilePicture}
                size="xl"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent key="personal-content" value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={personalInfo.name || ""}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, name: e.target.value })
                    }
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email || ""}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        email: e.target.value,
                      })
                    }
                    placeholder="Your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone || ""}
                    onChange={(e) =>
                      setPersonalInfo({
                        ...personalInfo,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Your phone number"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent key="addresses-content" value="addresses">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Addresses</CardTitle>
              <CardDescription>
                Manage your shipping addresses for faster checkout.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Existing Addresses Section */}
                <div className="space-y-4">
                  {addresses && addresses.length > 0 ? (
                    addresses.map((address) => (
                      <div
                        key={
                          address._id ||
                          `address-${address.street}-${address.zipCode}`
                        }
                        className="flex justify-between items-start p-4 border rounded-lg bg-white shadow-sm"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">
                              {address.isDefault && (
                                <span key="default" className="text-primary">
                                  (Default){" "}
                                </span>
                              )}
                              {address.street}
                            </p>
                            {isDeliverySupported(address.city, address.state) ? (
                              <CheckCircle className="h-4 w-4 text-green-600" title="Delivery available" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-600" title="Limited delivery" />
                            )}
                          </div>
                          <p key="location" className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p key="country" className="text-sm text-gray-600">
                            {address.country}
                          </p>
                          {address.phone && (
                            <p key="phone" className="text-sm text-gray-600">
                              Phone: {address.phone}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${
                            isDeliverySupported(address.city, address.state) 
                              ? 'text-green-600' 
                              : 'text-amber-600'
                          }`}>
                            {isDeliverySupported(address.city, address.state) 
                              ? 'Delivery available' 
                              : 'Limited delivery options'
                            }
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAddress(address._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No addresses added yet.</p>
                      <p className="text-sm text-gray-400">
                        Add your first address below for faster checkout.
                      </p>
                    </div>
                  )}
                </div>

                {/* Add New Address Form */}
                <div className="mt-8 pt-6 border-t">
                  <form onSubmit={handleAddressSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Add New Address</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Add addresses for faster checkout. We support delivery to Metro Manila and South Luzon provinces.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="street">Street Address*</Label>
                      <Input
                        id="street"
                        value={newAddress.street}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            street: e.target.value,
                          })
                        }
                        placeholder="123 Main Street, Barangay"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Include house/unit number and barangay for accurate delivery
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state">Province/Region*</Label>
                        <Select 
                          value={newAddress.state} 
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
                          We deliver to Metro Manila and South Luzon provinces
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="city">City/Municipality*</Label>
                        <Select 
                          value={newAddress.city} 
                          onValueChange={(value) => handleSelectChange('city', value)}
                          disabled={!newAddress.state}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={newAddress.state ? "Select city" : "Select province first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCities.map((city) => (
                              <SelectItem key={city.value} value={city.value}>
                                {city.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!newAddress.state && (
                          <p className="text-sm text-gray-500 mt-1">Please select a province first</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP/Postal Code*</Label>
                        <Input
                          id="zipCode"
                          value={newAddress.zipCode}
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
                        <Label htmlFor="country">Country*</Label>
                        <Select 
                          value={newAddress.country} 
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
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="flex items-center rounded-md border border-input bg-white">
                        <span className="pl-3 text-sm text-muted-foreground">+63</span>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="9123456789"
                          value={formatPhone(newAddress.phone)}
                          onChange={handlePhoneChange}
                          className="w-full border-0 bg-transparent p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                          maxLength="10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        10-digit mobile number for delivery updates (optional)
                      </p>
                    </div>

                    {/* Delivery Coverage Indicator */}
                    {newAddress.state && newAddress.city && (
                      <div className={`p-4 rounded-lg border ${
                        isDeliverySupported(newAddress.city, newAddress.state) 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-amber-50 border-amber-200'
                      }`}>
                        {isDeliverySupported(newAddress.city, newAddress.state) ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <h4 className="font-medium text-green-800">Delivery Available</h4>
                            </div>
                            <p className="text-sm text-green-700">
                              This location is within our delivery coverage area. You can order for delivery to this address.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                              <h4 className="font-medium text-amber-800">Limited Delivery</h4>
                            </div>
                            <p className="text-sm text-amber-700">
                              This location may have limited delivery options. Please contact support for more information.
                            </p>
                          </>
                        )}
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">📍 Delivery Information</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Coverage:</strong> Metro Manila (NCR) and South Luzon provinces (Cavite, Laguna, Batangas, Rizal)</p>
                        <p><strong>Checkout:</strong> Your saved addresses will appear during checkout for quick selection</p>
                        <p><strong>Default:</strong> Mark an address as default to automatically select it during checkout</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={newAddress.isDefault}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            isDefault: e.target.checked,
                          })
                        }
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="isDefault" className="text-sm">
                        Set as default address
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading || !isDeliverySupported(newAddress.city, newAddress.state)}
                      className="w-full"
                    >
                      {loading ? "Adding..." : "Add Address"}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BuyerManageProfile;
