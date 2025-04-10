import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminDashboardPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-4 mb-6">
        <Link to="/admin-dashboard/users">
          <Button variant="outline">Manage Users</Button>
        </Link>
        <Link to="/admin-dashboard/listings">
          <Button variant="outline">Manage Listings</Button>
        </Link>
      </div>

      <div className="bg-background rounded-lg shadow p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
