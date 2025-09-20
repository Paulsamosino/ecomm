import React, { useState } from "react";
import InventoryPage from "@/pages/InventoryPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";

export default function ToolsHubPage() {
  const [tab, setTab] = useState("inventory");

  return (
    <div className="min-h-screen w-full">
  {/* keep a small outer margin so /tools doesn't render full-bleed */}
  <div className="mx-4 sm:mx-6 lg:mx-8 px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Tools Hub</h1>
        <div className="text-sm text-gray-500">Access Inventory, Breeding Management, and more</div>
      </div>

        <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("inventory")}
          className={`px-3 py-1 rounded ${tab === "inventory" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
        >
          Inventory
        </button>
        <button
          onClick={() => setTab("breeding")}
          className={`px-3 py-1 rounded ${tab === "breeding" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
        >
          Breeding Management
        </button>
        <button
          onClick={() => setTab("records")}
          className={`px-3 py-1 rounded ${tab === "records" ? "bg-orange-500 text-white" : "bg-gray-100"}`}
        >
          Record keeping (coming soon)
        </button>
      </div>

  <div className="bg-white rounded-lg shadow p-4">
        {tab === "inventory" && (
          <div>
            <InventoryPage />
          </div>
        )}

        {tab === "breeding" && (
          <div>
            <BreedingManagementPage />
          </div>
        )}

        {tab === "records" && (
          <div className="p-6 text-center text-gray-600">
            <h3 className="text-lg font-semibold mb-2">Record keeping</h3>
            <p>Coming soon — we'll add tools to manage farm records, expenses, and performance here.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
