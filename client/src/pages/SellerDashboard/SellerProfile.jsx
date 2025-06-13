import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import ProfilePictureUpload from "@/components/ui/ProfilePictureUpload";
import ProfileAvatar from "@/components/ui/ProfileAvatar";

const SellerProfile = () => {
  const { user } = useAuth();

  // Sample placeholder data
  const profile = {
    name: user?.name || "Farm Fresh Poultry",
    email: user?.email || "contact@farmfreshpoultry.com",
    phone: "(555) 123-4567",
    location: "Rural County, Farmland",
    website: "www.farmfreshpoultry.com",
    bio: "We specialize in free-range, organically-raised poultry and farm-fresh eggs. Our family farm has been in operation for over 20 years.",
    verified: true,
    joinDate: "March 2022",
    rating: 4.8,
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile Info */}
        <div className="w-full md:w-1/3">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl shadow-sm border border-orange-200 overflow-hidden p-6 animate-fade-in">
            <div className="flex flex-col items-center mb-6">
              <div className="mb-4">
                <ProfilePictureUpload
                  currentImage={user?.profilePicture}
                  size="xl"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-800">
                {profile.name}
              </h2>
              {profile.verified && (
                <div className="flex items-center mt-1 text-green-600 text-sm">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  <span>Verified Seller</span>
                </div>
              )}

              <div className="mt-1 text-sm text-gray-500">
                Member since {profile.joinDate}
              </div>

              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.floor(profile.rating)
                        ? "text-amber-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-sm ml-1 font-medium text-gray-700">
                  {profile.rating}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Mail className="w-4 h-4 mr-3 text-orange-500" />
                <span className="text-sm">{profile.email}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Phone className="w-4 h-4 mr-3 text-orange-500" />
                <span className="text-sm">{profile.phone}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <MapPin className="w-4 h-4 mr-3 text-orange-500" />
                <span className="text-sm">{profile.location}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Globe className="w-4 h-4 mr-3 text-orange-500" />
                <span className="text-sm">{profile.website}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-orange-200">
              <p className="text-sm text-gray-600 italic">"{profile.bio}"</p>
            </div>

            <Button className="w-full mt-6 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white border-none">
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Additional Sections */}
        <div className="w-full md:w-2/3 space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                Account Settings
              </h3>
              <Button
                variant="ghost"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 h-auto"
              >
                Manage
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {[
                "Password & Security",
                "Notification Preferences",
                "Privacy Settings",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-orange-600">
                    {item}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">
                Business Information
              </h3>
              <Button
                variant="ghost"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 h-auto"
              >
                Update
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800">
                    Farm Fresh Poultry
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / EIN
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800">
                    ••••••5678
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800">
                    Farm & Agriculture
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Established
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800">
                    2002
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
