import React from "react";
import { User } from "lucide-react";

const ProfileAvatar = ({
  user,
  size = "md",
  className = "",
  showOnlineStatus = false,
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    "2xl": "w-32 h-32",
  };

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-4xl",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
    "2xl": "w-16 h-16",
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm`}
      >
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.name || "Profile"}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}

        {/* Fallback initials/icon */}
        <div
          className={`w-full h-full flex items-center justify-center text-white font-medium ${
            textSizes[size]
          } ${user?.profilePicture ? "hidden" : "flex"}`}
        >
          {user?.name ? (
            user.name.charAt(0).toUpperCase()
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
      </div>

      {/* Online status indicator */}
      {showOnlineStatus && user?.isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};

export default ProfileAvatar;
