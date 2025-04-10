import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BreedingManagementPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Breeding Management System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="record-keeping">
          <Button variant="outline" className="w-full">
            Record Keeping
          </Button>
        </Link>
        <Link to="breeding-planning">
          <Button variant="outline" className="w-full">
            Breeding Planning
          </Button>
        </Link>
        <Link to="data-analytics">
          <Button variant="outline" className="w-full">
            Data Analytics
          </Button>
        </Link>
        <Link to="inventory">
          <Button variant="outline" className="w-full">
            Inventory Management
          </Button>
        </Link>
        <Link to="reports">
          <Button variant="outline" className="w-full">
            Report and Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default BreedingManagementPage;
