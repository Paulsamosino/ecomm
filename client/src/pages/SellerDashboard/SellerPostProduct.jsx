import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiAddProduct } from "@/lib/api";

const SellerPostProduct = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    category: "poultry", // Default category
    breed: "",
    age: "",
    weight: "",
    images: [],
    location: "",
    shippingInfo: "",
  });

  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    // Preview images
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
    setFormData((prev) => ({
      ...prev,
      images: files,
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title) errors.title = "Title is required";
    if (!formData.description) errors.description = "Description is required";
    if (!formData.price) errors.price = "Price is required";
    if (isNaN(formData.price)) errors.price = "Price must be a number";
    if (!formData.quantity) errors.quantity = "Quantity is required";
    if (isNaN(formData.quantity)) errors.quantity = "Quantity must be a number";
    if (!formData.breed) errors.breed = "Breed is required";
    if (!formData.age) errors.age = "Age is required";
    if (!formData.weight) errors.weight = "Weight is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.shippingInfo)
      errors.shippingInfo = "Shipping information is required";
    if (formData.images.length === 0)
      errors.images = "At least one image is required";

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Create FormData object to handle file uploads
      const productData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "images") {
          formData.images.forEach((image) => {
            productData.append("images", image);
          });
        } else {
          productData.append(key, formData[key]);
        }
      });

      // Make API call to create product using axios
      await apiAddProduct(productData);

      toast.success("Product posted successfully!");
      // Reset form
      setFormData({
        title: "",
        description: "",
        price: "",
        quantity: "",
        category: "poultry",
        breed: "",
        age: "",
        weight: "",
        images: [],
        location: "",
        shippingInfo: "",
      });
      setPreviewImages([]);
    } catch (error) {
      console.error("Error posting product:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to post product. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-brown-dark">
          Post a Product
        </h2>
        <p className="text-brown-dark/60">
          Fill in the details below to list your product for sale.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Product Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Rhode Island Red Chickens"
            />
          </div>
          <div>
            <Input
              label="Price (USD)"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Quantity Available"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              placeholder="Number of items"
            />
          </div>
          <div>
            <Input
              label="Breed"
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              error={errors.breed}
              placeholder="e.g., Plymouth Rock"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Input
              label="Age"
              name="age"
              value={formData.age}
              onChange={handleChange}
              error={errors.age}
              placeholder="e.g., 6 months"
            />
          </div>
          <div>
            <Input
              label="Weight"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              error={errors.weight}
              placeholder="e.g., 2.5 kg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-dark mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              errors.description ? "border-red-500" : "border-gray-200"
            }`}
            placeholder="Provide detailed information about your product..."
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        <div>
          <Input
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            error={errors.location}
            placeholder="e.g., Miami, FL"
          />
        </div>

        <div>
          <Input
            label="Shipping Information"
            name="shippingInfo"
            value={formData.shippingInfo}
            onChange={handleChange}
            error={errors.shippingInfo}
            placeholder="Describe shipping options and requirements"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brown-dark mb-2">
            Product Images (Max 5)
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">
                Click to upload images (PNG, JPG)
              </span>
            </label>
          </div>
          {errors.images && (
            <p className="mt-1 text-xs text-red-500">{errors.images}</p>
          )}
          {previewImages.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {previewImages.map((preview, index) => (
                <div key={index} className="aspect-square relative">
                  <div className="w-full h-full overflow-hidden rounded-lg bg-amber-50">
                    {preview === "🐣" ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src="/1f425.png"
                          alt="Baby chick"
                          className="w-16 h-16 hover:scale-110 transition-transform"
                        />
                      </div>
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 text-red-500 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>Please fix the errors above before submitting.</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting Product...
            </>
          ) : (
            "Post Product"
          )}
        </Button>
      </form>
    </div>
  );
};

export default SellerPostProduct;
