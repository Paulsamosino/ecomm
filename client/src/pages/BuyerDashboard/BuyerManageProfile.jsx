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
import { User, MapPin, Camera } from "lucide-react";
import ProfilePictureUpload from "@/components/ui/ProfilePictureUpload";

const BuyerManageProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

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
        country: "",
        phone: "",
        isDefault: false,
      });

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
                        <div>
                          <p className="font-medium">
                            {address.isDefault && (
                              <span key="default" className="text-primary">
                                (Default){" "}
                              </span>
                            )}
                            {address.street}
                          </p>
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
                    <p
                      key="no-addresses"
                      className="text-gray-500 text-center py-4"
                    >
                      No addresses added yet.
                    </p>
                  )}
                </div>

                {/* Add New Address Form */}
                <div className="mt-8 pt-6 border-t">
                  <form onSubmit={handleAddressSubmit} className="space-y-4">
                    <h3 className="text-lg font-medium">Add New Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="Street address"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City*</Label>
                        <Input
                          id="city"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              city: e.target.value,
                            })
                          }
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State*</Label>
                        <Input
                          id="state"
                          value={newAddress.state}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              state: e.target.value,
                            })
                          }
                          placeholder="State"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code*</Label>
                        <Input
                          id="zipCode"
                          value={newAddress.zipCode}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              zipCode: e.target.value,
                            })
                          }
                          placeholder="ZIP code"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country*</Label>
                        <Input
                          id="country"
                          value={newAddress.country}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              country: e.target.value,
                            })
                          }
                          placeholder="Country"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress({
                              ...newAddress,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Phone number"
                        />
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
                      />
                      <Label htmlFor="isDefault">Set as default address</Label>
                    </div>
                    <Button type="submit" disabled={loading}>
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
