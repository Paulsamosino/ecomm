import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "@/contexts/axios";

const SellerSettings = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    paymentMethods: "",
    shippingPolicy: "",
    returnPolicy: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user?.sellerProfile) {
      setFormData({
        businessName: user.sellerProfile.businessName || "",
        email: user.email || "",
        phone: user.sellerProfile.phone || "",
        address: user.sellerProfile.address || "",
        city: user.sellerProfile.city || "",
        state: user.sellerProfile.state || "",
        zipCode: user.sellerProfile.zipCode || "",
        description: user.sellerProfile.description || "",
        paymentMethods: user.sellerProfile.paymentMethods || "",
        shippingPolicy: user.sellerProfile.shippingPolicy || "",
        returnPolicy: user.sellerProfile.returnPolicy || "",
        bankName: user.sellerProfile.bankName || "",
        accountNumber: user.sellerProfile.accountNumber || "",
        accountHolderName: user.sellerProfile.accountHolderName || "",
      });
    }
    setLoading(false);
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = {
      businessName: "Business name",
      email: "Email",
      phone: "Phone number",
      address: "Address",
      city: "City",
      state: "State",
      zipCode: "ZIP code",
      description: "Description",
      paymentMethods: "Payment methods",
      shippingPolicy: "Shipping policy",
      returnPolicy: "Return policy",
      bankName: "Bank name",
      accountNumber: "Account number",
      accountHolderName: "Account holder name",
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${label} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // ZIP code validation
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Please enter a valid ZIP code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await axiosInstance.put(
        "/auth/seller-profile",
        formData
      );
      updateUser(response.data.user);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Store Settings</h1>
        <p className="text-gray-600">Manage your store settings and profile</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Business Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Business Name
              </label>
              <Input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className={errors.businessName ? "border-red-500" : ""}
                placeholder="Your business name"
              />
              {errors.businessName && (
                <p className="text-sm text-red-500">{errors.businessName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "border-red-500" : ""}
                placeholder="contact@business.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "border-red-500" : ""}
                placeholder="(123) 456-7890"
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Address
              </label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={errors.address ? "border-red-500" : ""}
                placeholder="Street address"
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? "border-red-500" : ""}
                placeholder="City"
              />
              {errors.city && (
                <p className="text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State</label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={errors.state ? "border-red-500" : ""}
                placeholder="State"
              />
              {errors.state && (
                <p className="text-sm text-red-500">{errors.state}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <Input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={errors.zipCode ? "border-red-500" : ""}
                placeholder="ZIP code"
              />
              {errors.zipCode && (
                <p className="text-sm text-red-500">{errors.zipCode}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-medium text-gray-700">
              Business Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.description ? "border-red-500" : "border-gray-200"
              }`}
              placeholder="Describe your business..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Store Policies */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Store Policies</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Payment Methods
              </label>
              <textarea
                name="paymentMethods"
                value={formData.paymentMethods}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.paymentMethods ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="List accepted payment methods..."
              />
              {errors.paymentMethods && (
                <p className="text-sm text-red-500">{errors.paymentMethods}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Shipping Policy
              </label>
              <textarea
                name="shippingPolicy"
                value={formData.shippingPolicy}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.shippingPolicy ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Describe your shipping policy..."
              />
              {errors.shippingPolicy && (
                <p className="text-sm text-red-500">{errors.shippingPolicy}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Return Policy
              </label>
              <textarea
                name="returnPolicy"
                value={formData.returnPolicy}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors.returnPolicy ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Describe your return policy..."
              />
              {errors.returnPolicy && (
                <p className="text-sm text-red-500">{errors.returnPolicy}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <Input
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className={errors.bankName ? "border-red-500" : ""}
                placeholder="Your bank name"
              />
              {errors.bankName && (
                <p className="text-sm text-red-500">{errors.bankName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Number
              </label>
              <Input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={errors.accountNumber ? "border-red-500" : ""}
                placeholder="Your account number"
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500">{errors.accountNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Account Holder Name
              </label>
              <Input
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                className={errors.accountHolderName ? "border-red-500" : ""}
                placeholder="Name on account"
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500">
                  {errors.accountHolderName}
                </p>
              )}
            </div>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-xl bg-red-50 text-red-500 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>Please fix the errors above before saving.</p>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            size="lg"
            className="min-w-[200px]"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerSettings;
