import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ShoppingBag, Egg, User, Clock, Heart, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const BuyerDashboardPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white pt-16">
      {/* Farm-themed background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 bg-repeat opacity-5"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjZmM5ODMwIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMCAwaDIwdjIwSDB6Ii8+PHBhdGggZD0iTTIwIDBoMjB2MjBIMjB6Ii8+PHBhdGggZD0iTTAgMjBoMjB2MjBIMHoiLz48cGF0aCBkPSJNMjAgMjBoMjB2MjBIMjB6Ii8+PC9nPjwvc3ZnPg==')",
          }}
        />
        <div className="absolute top-20 -right-20 w-64 h-64 bg-orange-400/10 rounded-full blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-40 -left-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
        {/* Header with Farm Theme Icons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
              <ShoppingBag className="w-6 sm:w-8 h-6 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-700">
                My Purchases
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                Track and manage your poultry product orders
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              to="/wishlist"
              variant="ghost"
              className="flex-1 sm:flex-none justify-center text-orange-600 hover:bg-orange-100 hover:text-orange-700"
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm ml-2">Wishlist</span>
            </Button>
            <Button
              to="/products"
              className="flex-1 sm:flex-none justify-center bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white shadow-md"
            >
              <Egg className="h-4 w-4" />
              <span className="text-sm ml-2">Shop Now</span>
            </Button>
          </div>
        </div>

        {/* Buyer navigation buttons */}
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 mb-6">
          <Link
            to="/buyer-dashboard/purchases"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200 text-sm"
          >
            <Clock className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Order History</span>
          </Link>
          <Link
            to="/buyer-dashboard/profile"
            className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg bg-white text-orange-600 border border-orange-200 shadow-sm hover:shadow hover:bg-orange-50 transition-all duration-200 text-sm"
          >
            <User className="h-4 w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">My Profile</span>
          </Link>
        </div>

        {/* Main Content Area with Farm-themed Border */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-orange-100/50 py-2 sm:py-3 px-3 sm:px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingBag className="h-4 w-4 mr-2 text-orange-500" />
                <h2 className="text-sm font-medium text-orange-800">
                  Your Orders
                </h2>
              </div>
              <Button
                to="/"
                variant="ghost"
                size="sm"
                className="h-8 text-orange-600 hover:bg-orange-100 hover:text-orange-700"
              >
                <Home className="h-4 w-4" />
                <span className="text-xs ml-1">Return Home</span>
              </Button>
            </div>
          </div>
          <div className="p-0 sm:p-1">
            <Outlet />
          </div>
        </div>

        {/* Footer with Farm Theme */}
        <div className="mt-4 sm:mt-6 text-center pb-6">
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <Egg className="h-4 w-4" />
            <ShoppingBag className="h-4 w-4" />
          </div>
          <p className="text-[0.65rem] sm:text-xs text-gray-500 mt-2">
            C&P Poultry - Customer Dashboard © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboardPage;
