import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetProduct, apiUpdateProduct } from "@/api/products";
import { Loader2, Upload } from "lucide-react";
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

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsFetching(true);
      const product = await apiGetProduct(id);
      if (product.seller._id !== user.id && product.seller !== user.id) {
        toast.error("Unauthorized access");
        navigate("/seller/products");
        return;
      }
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category,
        breed: product.breed,
        age: product.age.toString(),
        quantity: product.quantity.toString(),
        location: product.location,
        shippingInfo: product.shippingInfo,
        images: [],
      });
      setExistingImages(product.images);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Error fetching product details");
      navigate("/seller/products");
    } finally {
      setIsFetching(false);
    }
  };

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
    if (!formData.name) errors.name = "Product name is required";
    if (!formData.description) errors.description = "Description is required";
    if (!formData.price) errors.price = "Price is required";
    if (isNaN(formData.price)) errors.price = "Price must be a number";
    if (!formData.quantity) errors.quantity = "Quantity is required";
    if (isNaN(formData.quantity)) errors.quantity = "Quantity must be a number";
    if (!formData.breed) errors.breed = "Breed is required";
    if (!formData.age) errors.age = "Age is required";
    if (!formData.location) errors.location = "Location is required";
    if (!formData.shippingInfo)
      errors.shippingInfo = "Shipping information is required";
    if (formData.images.length === 0 && existingImages.length === 0) {
      errors.images = "At least one image is required";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      // Add existing images that should be kept
      formDataToSend.append("existingImages", JSON.stringify(existingImages));

      await apiUpdateProduct(id, formDataToSend);
      toast.success("Product updated successfully");
      navigate("/seller/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Error updating product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  error={errors.price}
                  min="0"
                  step="0.01"
                  placeholder="Enter price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={errors.quantity}
                  min="0"
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
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
                  <SelectTrigger>
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
                <Label>Breed</Label>
                <Select
                  value={formData.breed}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, breed: value }))
                  }
                >
                  <SelectTrigger
                    className={errors.breed ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.category === "chicken" && (
                      <>
                        <SelectItem value="Rhode Island Red">
                          Rhode Island Red
                        </SelectItem>
                        <SelectItem value="Plymouth Rock">
                          Plymouth Rock
                        </SelectItem>
                        <SelectItem value="Leghorn">Leghorn</SelectItem>
                        <SelectItem value="Orpington">Orpington</SelectItem>
                        <SelectItem value="Wyandotte">Wyandotte</SelectItem>
                        <SelectItem value="Australorp">Australorp</SelectItem>
                        <SelectItem value="Sussex">Sussex</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </>
                    )}
                    {formData.category === "duck" && (
                      <>
                        <SelectItem value="Pekin">Pekin</SelectItem>
                        <SelectItem value="Muscovy">Muscovy</SelectItem>
                        <SelectItem value="Runner">Runner</SelectItem>
                        <SelectItem value="Khaki Campbell">
                          Khaki Campbell
                        </SelectItem>
                        <SelectItem value="Welsh Harlequin">
                          Welsh Harlequin
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </>
                    )}
                    {formData.category === "turkey" && (
                      <>
                        <SelectItem value="Bourbon Red">Bourbon Red</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                        <SelectItem value="White Holland">
                          White Holland
                        </SelectItem>
                        <SelectItem value="Narragansett">
                          Narragansett
                        </SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </>
                    )}
                    {formData.category === "other" && (
                      <>
                        <SelectItem value="Feed">Feed</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errors.breed && (
                  <p className="mt-1 text-xs text-red-500">{errors.breed}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (months)</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  error={errors.age}
                  min="0"
                  placeholder="Enter age in months"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={errors.location}
                  placeholder="Enter location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingInfo">Shipping Information</Label>
              <Textarea
                id="shippingInfo"
                name="shippingInfo"
                value={formData.shippingInfo}
                onChange={handleChange}
                error={errors.shippingInfo}
                placeholder="Enter shipping information"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Product Images</Label>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                  <div className="grid grid-cols-5 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="aspect-square relative">
                        <div className="w-full h-full overflow-hidden rounded-lg bg-amber-50">
                          {image === "🐣" ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src="/1f425.png"
                                alt="Baby chick"
                                className="w-16 h-16 hover:scale-110 transition-transform"
                              />
                            </div>
                          ) : (
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="images"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload images</span>
                      <input
                        id="images"
                        name="images"
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB (max. 5 images)
                  </p>
                </div>
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
                            <span className="text-4xl">🐣</span>
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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/seller/products")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProduct;
