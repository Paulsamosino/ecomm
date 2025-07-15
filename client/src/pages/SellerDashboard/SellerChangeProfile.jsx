import React from "react";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ProfilePictureUpload from "@/components/ui/ProfilePictureUpload";

const SellerChangeProfile = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Change Profile Picture
          </h1>
          <p className="text-gray-600">
            Update your profile picture to personalize your seller account.
          </p>
        </div>

        {/* Profile Picture Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Camera className="w-5 h-5 mr-2 text-orange-500" />
              Profile Picture
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a clear photo that represents you or your business.
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Current Profile Display */}
              <div className="text-center">
                <div className="mb-4">
                  <ProfilePictureUpload
                    currentImage={user?.profilePicture}
                    size="xl"
                  />
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.name}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Instructions */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 w-full max-w-md">
                <h4 className="text-sm font-medium text-orange-800 mb-2">
                  Photo Guidelines:
                </h4>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• Use a high-quality image (at least 200x200px)</li>
                  <li>• Face should be clearly visible and well-lit</li>
                  <li>• Avoid group photos or images with text</li>
                  <li>• Professional or business-appropriate appearance</li>
                </ul>
              </div>

              {/* Success Message Area */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Click on the profile picture above to upload a new image.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <User className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Why update your profile picture?
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                A professional profile picture helps build trust with customers
                and makes your business more recognizable in the marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerChangeProfile;
