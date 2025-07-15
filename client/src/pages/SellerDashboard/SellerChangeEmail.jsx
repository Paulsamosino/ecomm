import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Mail, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/contexts/axios";

const SellerChangeEmail = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (formData.email === user?.email) {
      toast.error("This is already your current email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.put("/auth/seller-profile", {
        email: formData.email.trim(),
      });
      
      updateUser(response.data.user);
      toast.success("Email updated successfully");
    } catch (error) {
      console.error("Error updating email:", error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes("email")) {
        toast.error("This email is already in use by another account");
      } else {
        toast.error(error.response?.data?.message || "Failed to update email");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mx-auto mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Change Email</h1>
        <p className="text-gray-600">Update your email address</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Email Information</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "border-red-500" : ""}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Current email display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Current email: <span className="font-medium text-gray-800">{user?.email}</span>
            </p>
          </div>

          {/* Important notice */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You'll need to verify your new email address</li>
                  <li>This will be your new login email</li>
                  <li>Make sure you have access to the new email</li>
                </ul>
              </div>
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
            disabled={loading || formData.email.trim() === user?.email}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Email...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Email
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerChangeEmail;
