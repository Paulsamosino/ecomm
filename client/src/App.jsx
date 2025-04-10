import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/routes/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { PayPalProvider } from "@/config/paypal";
import MainLayout from "@/components/layout/MainLayout";
import SellerLayout from "@/components/layout/SellerLayout";
import ApiDebug from "@/components/common/ApiDebug";

import HomePage from "@/pages/HomePage";
import ProductListPage from "@/pages/ProductListPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SellerRegisterPage from "@/pages/SellerRegisterPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import SellerDashboard from "@/pages/SellerDashboard/SellerDashboard";
import SellerProducts from "@/pages/SellerDashboard/SellerProducts";
import SellerOrders from "@/pages/SellerDashboard/SellerOrders";
import SellerReviews from "@/pages/SellerDashboard/SellerReviews";
import SellerSettings from "@/pages/SellerDashboard/SellerSettings";
import SellerAnalytics from "@/pages/SellerDashboard/SellerAnalytics";
import SellerCustomers from "@/pages/SellerDashboard/SellerCustomers";
import SellerHelp from "@/pages/SellerDashboard/SellerHelp";
import SellerCartManagement from "@/pages/SellerDashboard/SellerCartManagement";
import SellerPayments from "@/pages/SellerDashboard/SellerPayments";
import BuyerDashboardPage from "@/pages/BuyerDashboardPage";
import ChatPage from "@/pages/ChatPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";
import HelpCenterPage from "@/pages/HelpCenterPage";
import ContactUsPage from "@/pages/ContactUsPage";
import CartPage from "@/pages/CartPage";
import WishlistPage from "@/pages/WishlistPage";
import CheckoutPage from "@/pages/CheckoutPage";

// Import Buyer Dashboard Components
import BuyerMyPurchase from "@/pages/BuyerDashboard/BuyerMyPurchase";
import BuyerManageProfile from "@/pages/BuyerDashboard/BuyerManageProfile";

// Import Admin Dashboard Components
import AdminManageUsers from "@/pages/AdminDashboard/AdminManageUsers";
import AdminManageListings from "@/pages/AdminDashboard/AdminManageListings";

// Import Seller Route
import SellerRoute from "@/components/routes/SellerRoute";
import AddProduct from "@/pages/SellerDashboard/AddProduct";
import EditProduct from "@/pages/SellerDashboard/EditProduct";
import ChatRoom from "@/components/chat/ChatRoom";
import EnhancedChatPage from "@/pages/EnhancedChatPage";
import SellerMessages from "@/pages/SellerDashboard/SellerMessages";

const AppContent = () => {
  const location = useLocation();
  const isSellerRoute = location.pathname.startsWith("/seller");
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <>
      {!isSellerRoute && !isAdminRoute && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="register/seller" element={<SellerRegisterPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="help-center" element={<HelpCenterPage />} />
          <Route path="contact" element={<ContactUsPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>

        {/* Protected Buyer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route path="buyer-dashboard" element={<BuyerDashboardPage />}>
              <Route index element={<BuyerMyPurchase />} />
              <Route path="purchases" element={<BuyerMyPurchase />} />
              <Route path="profile" element={<BuyerManageProfile />} />
            </Route>
            <Route path="chat" element={<EnhancedChatPage />} />
            <Route path="chat/:chatId" element={<EnhancedChatPage />} />
          </Route>
        </Route>

        {/* Protected Seller Routes */}
        <Route path="/seller" element={<SellerRoute />}>
          <Route element={<SellerLayout />}>
            <Route index element={<SellerDashboard />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="messages" element={<SellerMessages />} />
            <Route path="messages/:chatId" element={<SellerMessages />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="products" element={<SellerProducts />} />
            <Route path="products/new" element={<AddProduct />} />
            <Route path="products/edit/:id" element={<EditProduct />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="reviews" element={<SellerReviews />} />
            <Route path="customers" element={<SellerCustomers />} />
            <Route path="cart" element={<SellerCartManagement />} />
            <Route path="payments" element={<SellerPayments />} />
            <Route path="settings" element={<SellerSettings />} />
            <Route path="help" element={<SellerHelp />} />
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route index element={<AdminManageUsers />} />
            <Route path="users" element={<AdminManageUsers />} />
            <Route path="listings" element={<AdminManageListings />} />
          </Route>
        </Route>

        {/* Redirect to home if no route matches */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <PayPalProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                style: {
                  background: "#36d399",
                },
              },
              error: {
                style: {
                  background: "#f87272",
                },
              },
            }}
          />
          <ApiDebug />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="register/seller" element={<SellerRegisterPage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="help-center" element={<HelpCenterPage />} />
              <Route path="contact" element={<ContactUsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
            </Route>

            {/* Protected Buyer Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route path="buyer-dashboard" element={<BuyerDashboardPage />}>
                  <Route index element={<BuyerMyPurchase />} />
                  <Route path="purchases" element={<BuyerMyPurchase />} />
                  <Route path="profile" element={<BuyerManageProfile />} />
                </Route>
                <Route path="chat" element={<EnhancedChatPage />} />
                <Route path="chat/:chatId" element={<EnhancedChatPage />} />
              </Route>
            </Route>

            {/* Protected Seller Routes */}
            <Route path="/seller" element={<SellerRoute />}>
              <Route element={<SellerLayout />}>
                <Route index element={<SellerDashboard />} />
                <Route path="dashboard" element={<SellerDashboard />} />
                <Route path="messages" element={<SellerMessages />} />
                <Route path="messages/:chatId" element={<SellerMessages />} />
                <Route path="analytics" element={<SellerAnalytics />} />
                <Route path="products" element={<SellerProducts />} />
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="orders" element={<SellerOrders />} />
                <Route path="reviews" element={<SellerReviews />} />
                <Route path="customers" element={<SellerCustomers />} />
                <Route path="cart" element={<SellerCartManagement />} />
                <Route path="payments" element={<SellerPayments />} />
                <Route path="settings" element={<SellerSettings />} />
                <Route path="help" element={<SellerHelp />} />
              </Route>
            </Route>

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<AdminManageUsers />} />
                <Route path="users" element={<AdminManageUsers />} />
                <Route path="listings" element={<AdminManageListings />} />
              </Route>
            </Route>

            {/* Redirect to home if no route matches */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PayPalProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
