import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SuccessPayment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate("/buyer-dashboard/purchases");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been successfully
          processed.
        </p>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-green-700 text-sm">
              You will be automatically redirected to your orders in 5
              seconds...
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Link to="/buyer-dashboard/purchases">
            <Button className="w-full bg-primary hover:bg-primary/90">
              View My Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <Link to="/products">
            <Button variant="outline" className="w-full">
              Continue Shopping
              <ShoppingBag className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPayment;
