import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShoppingCart,
  Users,
  Shield,
  Truck,
  Clock,
  Store,
  ChevronRight,
  Star,
  Heart,
  Eye,
  Badge,
  Award,
  Zap,
  ArrowRight,
  Check,
} from "lucide-react";

// Mock data - in a real application, this would come from an API
const FEATURED_PRODUCTS = [
  {
    id: 1,
    title: "Premium Layer Hens",
    price: 25.99,
    image: "/public/chicken.svg", // Using existing image
    rating: 4.8,
    reviews: 124,
    seller: "Green Valley Farm",
    discount: 10,
    isNew: true,
    tag: "Best Seller",
  },
  {
    id: 2,
    title: "Organic Feed Mix",
    price: 45.99,
    image: "/public/chicken.svg", // Using existing image
    rating: 4.9,
    reviews: 89,
    seller: "Nature's Best",
    discount: 0,
    isNew: false,
  },
  {
    id: 3,
    title: "Breeding Equipment Set",
    price: 199.99,
    image: "/public/chicken.svg", // Using existing image
    rating: 4.7,
    reviews: 56,
    seller: "Pro Breeder Tools",
    discount: 15,
    isNew: false,
  },
  {
    id: 4,
    title: "Free Range Chickens",
    price: 35.99,
    image: "/public/chicken.svg", // Using existing image
    rating: 4.9,
    reviews: 112,
    seller: "Happy Hens Farm",
    discount: 0,
    isNew: true,
  },
];

const CATEGORIES = [
  { id: 1, name: "Chicken", count: 145, image: "/public/chicken.svg" },
  { id: 2, name: "Eggs", count: 89, image: "/public/chicken.svg" },
  { id: 3, name: "Feed", count: 67, image: "/public/chicken.svg" },
  { id: 4, name: "Equipment", count: 103, image: "/public/chicken.svg" },
];

const HomePage = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/5 to-primary/10 pt-8 pb-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="max-w-lg">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  #1 Poultry Marketplace
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Quality Poultry &{" "}
                  <span className="text-primary">Livestock</span> Marketplace
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  Connect with trusted breeders, farmers, and buyers. Buy and
                  sell livestock with confidence in our secure marketplace.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/products"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Shop Now
                  </Link>
                  {!user && (
                    <Link
                      to="/register/seller"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Store className="mr-2 h-5 w-5" />
                      Sell Products
                    </Link>
                  )}
                </div>

                {/* Trust badges */}
                <div className="flex items-center gap-4 mt-8">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Check className="h-4 w-4 text-primary mr-1" />
                    Verified Sellers
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Check className="h-4 w-4 text-primary mr-1" />
                    Secure Payments
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Check className="h-4 w-4 text-primary mr-1" />
                    24/7 Support
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-white shadow-xl">
                <img
                  src="/public/chicken.svg"
                  alt="Premium Chicken"
                  className="w-2/3 h-2/3 object-contain absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  30% OFF
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -right-4 -bottom-4 bg-white rounded-lg shadow-lg p-3 flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-semibold">4.9/5</span>
                <span className="text-gray-500 text-sm ml-1">
                  (2.5k+ reviews)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
            <p className="mt-2 text-gray-600">
              Find exactly what you're looking for
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {CATEGORIES.map((category) => (
              <Link
                to={`/products?category=${category.name.toLowerCase()}`}
                key={category.id}
              >
                <div className="group bg-white rounded-lg shadow hover:shadow-md transition-all overflow-hidden border border-gray-100">
                  <div className="p-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-4 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-12 h-12"
                      />
                    </div>
                    <h3 className="font-medium text-gray-900">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {category.count} products
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-600">Top picks curated for you</p>
            </div>
            <Link
              to="/products"
              className="text-primary font-medium flex items-center hover:underline"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us?</h2>
            <p className="mt-2 text-gray-600">
              We provide the best experience for buyers and sellers
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <BenefitCard
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Secure Transactions"
              description="All payments protected with escrow services"
            />
            <BenefitCard
              icon={<Award className="h-8 w-8 text-primary" />}
              title="Quality Guaranteed"
              description="All sellers verified and products checked"
            />
            <BenefitCard
              icon={<Truck className="h-8 w-8 text-primary" />}
              title="Fast Delivery"
              description="Professional livestock transportation options"
            />
            <BenefitCard
              icon={<Zap className="h-8 w-8 text-primary" />}
              title="Live Support"
              description="Expert assistance available 24/7"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
            <p className="mt-2 text-gray-600">
              Trusted by thousands of farmers and breeders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="I've been selling my poultry products on C&P for over a year now. The platform is easy to use and I've increased my sales by 40%!"
              author="John Smith"
              role="Poultry Farmer"
              rating={5}
            />
            <TestimonialCard
              quote="As a new breeder, I found exactly what I needed through this marketplace. The quality of the chickens I purchased exceeded my expectations."
              author="Sarah Johnson"
              role="Small Farm Owner"
              rating={5}
            />
            <TestimonialCard
              quote="The customer service is outstanding. When I had an issue with my order, they resolved it within hours. Highly recommend!"
              author="Michael Brown"
              role="Livestock Buyer"
              rating={4}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Poultry Business?
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8">
              Join thousands of buyers and sellers in our growing marketplace.
              Create your account today and take your poultry business to the
              next level.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to={user ? "/products" : "/register"}
                className="inline-flex items-center px-6 py-3 rounded-md bg-white text-primary font-medium hover:bg-gray-100 transition-colors"
              >
                {user ? "Browse Products" : "Sign Up Now"}
              </Link>
              <Link
                to="/contact-us"
                className="inline-flex items-center px-6 py-3 rounded-md bg-primary-dark text-white font-medium border border-white/30 hover:bg-primary-dark/90 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = ({ product }) => {
  const {
    id,
    title,
    price,
    image,
    rating,
    reviews,
    seller,
    discount,
    isNew,
    tag,
  } = product;

  const discountedPrice = discount
    ? (price - (price * discount) / 100).toFixed(2)
    : null;

  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-all border border-gray-100">
      <div className="relative">
        <Link to={`/products/${id}`}>
          <div className="aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>

        {/* Product tags */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {discount > 0 && (
            <span className="inline-block px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">
              {discount}% OFF
            </span>
          )}
          {isNew && (
            <span className="inline-block px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-md">
              NEW
            </span>
          )}
          {tag && (
            <span className="inline-block px-2 py-1 bg-primary text-white text-xs font-bold rounded-md">
              {tag}
            </span>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors">
            <Heart className="h-4 w-4" />
          </button>
          <button className="p-2 bg-white rounded-full shadow hover:bg-primary hover:text-white transition-colors">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <Link to={`/products/${id}`}>
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mb-2">by {seller}</p>

        <div className="flex items-center mb-2">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm text-gray-600 ml-1">
            {rating} ({reviews})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {discount > 0 ? (
              <>
                <span className="font-bold text-primary">
                  ${discountedPrice}
                </span>
                <span className="text-sm text-gray-400 line-through ml-2">
                  ${price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="font-bold text-primary">
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors">
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const BenefitCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-4 p-4 bg-primary/10 rounded-full">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const TestimonialCard = ({ quote, author, role, rating }) => (
  <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
    <div className="flex mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
    <p className="text-gray-600 mb-4 italic">"{quote}"</p>
    <div>
      <p className="font-medium text-gray-900">{author}</p>
      <p className="text-sm text-gray-500">{role}</p>
    </div>
  </div>
);

export default HomePage;
