import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import BouncingChicken from "@/components/common/BouncingChicken";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Link } from "react-router-dom";

const RegisterPage = () => {
  const { register, isLoading, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    const userData = {
      name,
      email,
      password,
      isSeller: false,
    };

    await register(userData);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-accent-light/20 to-primary/10">
      {/* Left Panel - Registration Form */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md animate-fade-in shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-brown-dark">
              Create Account
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Join our community of poultry enthusiasts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || passwordError) && (
                <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm">
                  {error || passwordError}
                </div>
              )}

              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="space-y-3 text-center text-sm">
                <p className="text-gray-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Sign in
                  </Link>
                </p>
                <p className="text-gray-500">
                  Want to sell your products?{" "}
                  <Link
                    to="/register/seller"
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Register as seller
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Welcome Message & Animation */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex-col items-center justify-center">
        <div className="text-center space-y-6 animate-slide-up mb-12">
          <h2 className="text-5xl font-bold text-brown-dark">
            Join C&P Today!
          </h2>
          <p className="text-2xl text-brown-light">
            Start Your Poultry Journey
          </p>
          <p className="text-xl text-brown-light/80">
            Connect with Farmers and Buyers Nationwide
          </p>
        </div>

        <div className="mt-8 mb-12">
          <BouncingChicken />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
