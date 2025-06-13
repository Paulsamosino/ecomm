import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "./button";
import { useAuth } from "@/contexts/AuthContext";
import axiosInstance from "@/api/axios";
import toast from "react-hot-toast";

const ProfilePictureUpload = ({ currentImage, onImageUpdate, size = "lg" }) => {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(currentImage || null);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-40 h-40",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    handleImageUpload(file);
  };

  const handleImageUpload = async (file) => {
    setIsUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);

      // Upload to cloudinary via our backend
      const formData = new FormData();
      formData.append("image", file);
      const uploadResponse = await axiosInstance.post(
        "/upload/image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const imageUrl = uploadResponse.data.url;

      // Update user profile with new image URL
      const profileResponse = await axiosInstance.post(
        "/auth/profile-picture",
        { profilePicture: imageUrl }
      );

      // Update local user state
      updateUser({ ...user, profilePicture: imageUrl });

      // Call callback if provided
      if (onImageUpdate) {
        onImageUpdate(imageUrl);
      }

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "Failed to upload image";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Upload failed: ${error.message}`;
      }
      toast.error(errorMessage);
      // Reset preview to previous image or null if no previous image
      setPreviewImage(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploading(true);
    try {
      await axiosInstance.post("/auth/profile-picture", {
        profilePicture: null,
      });

      setPreviewImage(null);
      updateUser({ ...user, profilePicture: null });

      if (onImageUpdate) {
        onImageUpdate(null);
      }

      toast.success("Profile picture removed successfully!");
    } catch (error) {
      console.error("Remove error:", error);
      let errorMessage = "Failed to remove profile picture";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Remove failed: ${error.message}`;
      }
      toast.error(errorMessage);
      // Keep the current preview state since removal failed
      setPreviewImage(previewImage);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-orange-200 shadow-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative`}
        >
          {previewImage ? (
            <img
              src={previewImage}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-400 to-orange-600">
              <span className="text-white font-bold text-xl">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isUploading ? (
              <Loader2
                className={`${iconSizes[size]} text-white animate-spin`}
              />
            ) : (
              <Camera className={`${iconSizes[size]} text-white`} />
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors duration-200 disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Remove button */}
        {previewImage && (
          <button
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors duration-200 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Upload button */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : "Change Photo"}
        </Button>

        {previewImage && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Upload a profile picture. Recommended size: 400x400px. Max size: 5MB.
        Supported formats: JPG, PNG, GIF.
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
