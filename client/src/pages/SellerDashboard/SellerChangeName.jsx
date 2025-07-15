import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "@/contexts/axios";

const SellerChangeName = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.put("/auth/seller-profile", {
        name: formData.name.trim(),
      });
      
      updateUser(response.data.user);
      toast.success("Name updated successfully");
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error(error.response?.data?.message || "Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mx-auto mb-4">
          <User className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Change Name</h1>
        <p className="text-gray-600">Update your display name</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Full Name
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Current name display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Current name: <span className="font-medium text-gray-800">{user?.name}</span>
            </p>
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
            disabled={loading || formData.name.trim() === user?.name}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Name...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Name
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SellerChangeName;
