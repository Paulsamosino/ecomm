import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiAddProduct } from "@/api/products";
import { Loader2, Upload, X, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import BreedSelect from "@/components/ui/breed-select";

// Philippine regions for the location dropdown
const regions = [
  "NCR - National Capital Region",
  "CAR - Cordillera Administrative Region",
  "Region I - Ilocos Region",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "Region IV-B - MIMAROPA",
  "Region V - Bicol Region",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga Peninsula",
  "Region X - Northern Mindanao",
  "Region XI - Davao Region",
  "Region XII - SOCCSKSARGEN",
  "Region XIII - Caraga",
  "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao",
];

const AddProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [touched, setTouched] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "chicken",
    breed: "",
    age: "",
    quantity: "",
    images: [],
    location: "",
    shippingInfo: "",
  });

  const [errors, setErrors] = useState({});
  const [previewImages, setPreviewImages] = useState([]);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = formData.images.length + files.length;

    if (totalImages > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
    setTouched((prev) => ({
      ...prev,
      images: true,
    }));
    setErrors((prev) => ({
      ...prev,
      images: "",
    }));
  };

  const handleRemoveImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    const errors = {};
    switch (step) {
      case 1:
        if (!formData.name) errors.name = "Product name is required";
        if (!formData.description)
          errors.description = "Description is required";
        if (!formData.category) errors.category = "Category is required";
        if (!formData.breed) errors.breed = "Breed is required";
        break;
      case 2:
        if (!formData.price) errors.price = "Price is required";
        if (isNaN(formData.price)) errors.price = "Price must be a number";
        if (!formData.quantity) errors.quantity = "Quantity is required";
        if (isNaN(formData.quantity))
          errors.quantity = "Quantity must be a number";
        if (!formData.age) errors.age = "Age is required";
        break;
      case 3:
        if (!formData.location) errors.location = "Location is required";
        if (!formData.shippingInfo)
          errors.shippingInfo = "Shipping information is required";
        if (formData.images.length === 0)
          errors.images = "At least one image is required";
        break;
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setAttemptedSubmit(false);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setAttemptedSubmit(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "images") {
          formData.images.forEach((image) => {
            formDataToSend.append("images", image);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      await apiAddProduct(formDataToSend);
      toast.success("Product added successfully");
      navigate("/seller/products");
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error.message || "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                step === currentStep
                  ? "bg-amber-500 text-white"
                  : step < currentStep
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step < currentStep ? "✓" : step}
            </div>
            {step < 3 && (
              <ChevronRight
                className={`w-4 h-4 mx-2 ${
                  step < currentStep ? "text-green-500" : "text-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-2">
        <span className="text-sm font-medium text-gray-600">
          {currentStep === 1 && "Basic Information"}
          {currentStep === 2 && "Pricing & Details"}
          {currentStep === 3 && "Location & Images"}
        </span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Product Name"
            className={`h-12 text-lg pl-4 ${
              errors.name
                ? "border-red-500"
                : "border-gray-200 focus:border-amber-500"
            }`}
          />
          <Label
            htmlFor="name"
            className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500"
          >
            Product Name
          </Label>
          {errors.name && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name}
            </div>
          )}
        </div>

        <div className="relative">
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your product..."
            className={`min-h-[120px] resize-none ${
              errors.description
                ? "border-red-500"
                : "border-gray-200 focus:border-amber-500"
            }`}
          />
          <Label
            htmlFor="description"
            className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500"
          >
            Description
          </Label>
          {errors.description && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.description}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  category: value,
                  breed: "",
                }))
              }
            >
              <SelectTrigger
                className={`h-12 ${
                  errors.category
                    ? "border-red-500"
                    : "border-gray-200 focus:border-amber-500"
                }`}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chicken">Chicken</SelectItem>
                <SelectItem value="duck">Duck</SelectItem>
                <SelectItem value="turkey">Turkey</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-600">Breed</Label>
            <BreedSelect
              category={formData.category}
              value={formData.breed}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, breed: value }))
              }
              className={`h-12 ${
                errors.breed
                  ? "border-red-500"
                  : "border-gray-200 focus:border-amber-500"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="relative">
          <Input
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            placeholder="0.00"
            className={`h-12 text-lg pl-8 ${
              errors.price
                ? "border-red-500"
                : "border-gray-200 focus:border-amber-500"
            }`}
          />
          <span className="absolute top-3 left-3 text-gray-500">₱</span>
          <Label
            htmlFor="price"
            className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500"
          >
            Price
          </Label>
          {errors.price && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.price}
            </div>
          )}
        </div>

        <div className="relative">
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Available quantity"
            className={`h-12 ${
              errors.quantity
                ? "border-red-500"
                : "border-gray-200 focus:border-amber-500"
            }`}
          />
          <Label
            htmlFor="quantity"
            className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500"
          >
            Quantity
          </Label>
          {errors.quantity && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.quantity}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <Input
          id="age"
          name="age"
          type="number"
          value={formData.age}
          onChange={handleChange}
          placeholder="Age in months"
          className={`h-12 ${
            errors.age
              ? "border-red-500"
              : "border-gray-200 focus:border-amber-500"
          }`}
        />
        <Label
          htmlFor="age"
          className="absolute -top-2 left-3 bg-white px-1 text-xs text-gray-500"
        >
          Age (months)
        </Label>
        {errors.age && (
          <div className="flex items-center mt-1 text-red-500 text-xs">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.age}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Label className="text-sm text-gray-600">Location</Label>
          <Select
            value={formData.location}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, location: value }));
              setTouched((prev) => ({ ...prev, location: true }));
              setErrors((prev) => ({ ...prev, location: "" }));
            }}
          >
            <SelectTrigger
              className={`h-12 ${
                touched.location && errors.location && attemptedSubmit
                  ? "border-red-300"
                  : "border-gray-200 hover:border-gray-300 focus:border-amber-500"
              }`}
            >
              <SelectValue placeholder="Select your region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.location && errors.location && attemptedSubmit && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.location}
            </div>
          )}
        </div>

        <div className="relative">
          <Label className="text-sm text-gray-600">Shipping Information</Label>
          <Textarea
            id="shippingInfo"
            name="shippingInfo"
            value={formData.shippingInfo}
            onChange={handleChange}
            onBlur={() => handleBlur("shippingInfo")}
            placeholder="Enter shipping rates and handling requirements..."
            className={`min-h-[100px] resize-none ${
              touched.shippingInfo && errors.shippingInfo && attemptedSubmit
                ? "border-red-300"
                : "border-gray-200 hover:border-gray-300 focus:border-amber-500"
            }`}
          />
          {touched.shippingInfo && errors.shippingInfo && attemptedSubmit && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.shippingInfo}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Label className="text-sm text-gray-600">Product Images</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              touched.images && errors.images && attemptedSubmit
                ? "border-red-300 bg-red-50/30"
                : "border-gray-200 hover:border-amber-500/50 bg-gray-50/50"
            }`}
          >
            <div className="text-center">
              <Upload
                className={`mx-auto h-12 w-12 ${
                  touched.images && errors.images && attemptedSubmit
                    ? "text-red-300"
                    : "text-gray-400"
                }`}
              />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-amber-600 hover:text-amber-500">
                    Upload images
                  </span>
                  <input
                    id="images"
                    name="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB (max. 5 images)
                </p>
              </div>
            </div>
          </div>
          {touched.images && errors.images && attemptedSubmit && (
            <div className="flex items-center mt-1 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.images}
            </div>
          )}

          {previewImages.length > 0 && (
            <div className="grid grid-cols-5 gap-4 mt-4">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
              Add New Product
            </h1>

            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className="space-y-8">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              <div className="flex justify-between pt-6 border-t">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="px-6"
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/seller/products")}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 bg-amber-500 hover:bg-amber-600"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 bg-amber-500 hover:bg-amber-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Product...
                      </>
                    ) : (
                      "Add Product"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
