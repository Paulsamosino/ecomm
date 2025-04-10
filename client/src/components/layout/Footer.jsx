import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Users,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  User,
  BarChart,
  Shield,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send,
  CreditCard,
  Truck,
  Award,
} from "lucide-react";

const Footer = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Newsletter Section */}
      <div className="bg-primary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Subscribe to our newsletter
              </h3>
              <p className="text-gray-600">
                Get the latest products, promotions, and farming tips delivered
                to your inbox.
              </p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition flex items-center justify-center"
                >
                  <span>Subscribe</span>
                  <Send className="ml-2 h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="border-t border-b border-gray-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <Truck className="h-8 w-8 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-gray-900">
                Free Delivery
              </h4>
              <p className="text-xs text-gray-500 mt-1">On orders over $100</p>
            </div>
            <div className="flex flex-col items-center">
              <CreditCard className="h-8 w-8 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-gray-900">
                Secure Payment
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                100% secure transactions
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-gray-900">
                Quality Guarantee
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Verified sellers only
              </p>
            </div>
            <div className="flex flex-col items-center">
              <HelpCircle className="h-8 w-8 text-primary mb-3" />
              <h4 className="text-sm font-semibold text-gray-900">
                24/7 Support
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Dedicated customer service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">About C&P</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Your trusted marketplace for poultry and livestock trading. We
              connect breeders, farmers, and enthusiasts in a secure and
              reliable platform.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <FooterLink to="/products">Products</FooterLink>
              <FooterLink to="/breeding-management">
                Breeding Management
              </FooterLink>
              <FooterLink to="/help-center">Help Center</FooterLink>
              <FooterLink to="/contact-us">Contact Us</FooterLink>
              <FooterLink to="/about-us">About Us</FooterLink>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">My Account</h3>
            <ul className="space-y-2">
              {user ? (
                <>
                  {user.role === "seller" && (
                    <FooterLink to="/seller">Seller Dashboard</FooterLink>
                  )}
                  {user.role === "buyer" && (
                    <FooterLink to="/buyer-dashboard">My Account</FooterLink>
                  )}
                  <FooterLink to="/orders">My Orders</FooterLink>
                  <FooterLink to="/wishlist">Wishlist</FooterLink>
                  <FooterLink to="/chat">Messages</FooterLink>
                </>
              ) : (
                <>
                  <FooterLink to="/login">Sign In</FooterLink>
                  <FooterLink to="/register">Create Account</FooterLink>
                  <FooterLink to="/seller-register">Become a Seller</FooterLink>
                </>
              )}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  123 Poultry Street, Farming District, FL 12345
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <a
                  href="tel:+1234567890"
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                <a
                  href="mailto:support@candp.com"
                  className="text-sm text-gray-600 hover:text-primary"
                >
                  support@candp.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4 md:mb-0">
              <Link
                to="/privacy-policy"
                className="text-xs text-gray-500 hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-xs text-gray-500 hover:text-primary"
              >
                Terms of Service
              </Link>
              <Link
                to="/shipping-policy"
                className="text-xs text-gray-500 hover:text-primary"
              >
                Shipping Policy
              </Link>
              <Link
                to="/refund-policy"
                className="text-xs text-gray-500 hover:text-primary"
              >
                Refund Policy
              </Link>
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-primary mr-2" />
              <span className="text-xs text-gray-500">
                © {currentYear} Chicken & Poultry Marketplace. All rights
                reserved.
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Footer Link Component
const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="text-sm text-gray-600 hover:text-primary transition-colors"
    >
      {children}
    </Link>
  </li>
);

export default Footer;
