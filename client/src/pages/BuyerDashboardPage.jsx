import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BuyerDashboardPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Buyer Dashboard</h1>
      <div className="flex gap-4 mb-6">
        <Link to="/buyer-dashboard/purchases">
          <Button variant="outline">My Purchases</Button>
        </Link>
        <Link to="/buyer-dashboard/profile">
          <Button variant="outline">Manage Profile</Button>
        </Link>
      </div>

      <div className="bg-background rounded-lg shadow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default BuyerDashboardPage;
