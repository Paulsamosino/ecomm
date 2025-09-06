import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/api/axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Key } from "lucide-react";

const SellerChangePassword = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.post("/user/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(res.data.message || "Password updated successfully");
      // Clear auth and redirect to login
      localStorage.removeItem("token");
      if (logout) logout();
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white mx-auto mb-4">
          <Key className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Change Password</h1>
        <p className="text-gray-600">Update your account password</p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Security</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-200 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-200 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-200 rounded-md shadow-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                {loading ? "Saving..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SellerChangePassword;
