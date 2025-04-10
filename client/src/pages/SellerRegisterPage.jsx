import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import BouncingChicken from "@/components/common/BouncingChicken";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

const SellerRegisterPage = () => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    description: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    phone: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      isSeller: true,
      sellerProfile: {
        businessName: formData.businessName,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
      },
    };

    await register(userData);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-accent-light/20 to-primary/10">
      {/* Left Panel - Registration Form */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md animate-fade-in shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-brown-dark">
              Register as a Seller
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Join our marketplace as a poultry seller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || passwordError) && (
                <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm">
                  {error || passwordError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Information
                  </label>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <Input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Information
                  </label>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="businessName"
                      placeholder="Business Name"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                    <Textarea
                      name="description"
                      placeholder="Business Description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address
                  </label>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      name="address.street"
                      placeholder="Street Address"
                      value={formData.address.street}
                      onChange={handleChange}
                      required
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="text"
                        name="address.city"
                        placeholder="City"
                        value={formData.address.city}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        type="text"
                        name="address.state"
                        placeholder="State/Province"
                        value={formData.address.state}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="text"
                        name="address.zipCode"
                        placeholder="ZIP/Postal Code"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        required
                      />
                      <Input
                        type="text"
                        name="address.country"
                        placeholder="Country"
                        value={formData.address.country}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Information
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating seller account...
                  </>
                ) : (
                  "Create Seller Account"
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Welcome Message & Animation */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex-col items-center justify-center">
        <div className="text-center space-y-6 animate-slide-up mb-12">
          <h2 className="text-5xl font-bold text-brown-dark">
            Become a Seller!
          </h2>
          <p className="text-2xl text-brown-light">
            Join Our Poultry Marketplace
          </p>
          <p className="text-xl text-brown-light/80">
            Start Selling Your Products Today
          </p>
        </div>

        <div className="mt-8 mb-12">
          <BouncingChicken />
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
