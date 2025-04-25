import React from "react";
import { Outlet, Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const SellerDashboardPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <Link to="/seller-dashboard/profile">
          <Button variant="outline">Profile</Button>
        </Link>
        <Link to="/seller-dashboard/post-product">
          <Button variant="outline">Post Product</Button>
        </Link>
        <Link to="/seller-dashboard/orders">
          <Button variant="outline">Orders</Button>
        </Link>
        <Link to="/seller-dashboard/customers">
          <Button variant="outline">Customers</Button>
        </Link>
        <Link to="/seller-dashboard/cart">
          <Button variant="outline">Cart Management</Button>
        </Link>
        <Link to="/seller-dashboard/payments">
          <Button variant="outline">Payments</Button>
        </Link>
        <Link to="/seller-dashboard/analytics">
          <Button variant="outline">Analytics</Button>
        </Link>
        <Link to="/seller-dashboard/breeding-management">
          <Button variant="outline">Breeding Management</Button>
        </Link>
      </div>

      <div className="bg-background rounded-lg shadow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SellerDashboardPage;
