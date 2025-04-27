import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Shield,
  HelpCircle,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white mt-auto">
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

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center">
                <MapPin className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
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
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
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
