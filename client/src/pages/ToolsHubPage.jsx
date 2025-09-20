import React, { useState } from "react";
import InventoryPage from "@/pages/InventoryPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";
import ChangeHistoryPage from "@/pages/ChangeHistoryPage";
import { Package, Heart, History, Settings, BarChart3 } from "lucide-react";

export default function ToolsHubPage() {
  const [tab, setTab] = useState("inventory");

  const tabs = [
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      description: "Manage poultry inventory and stock levels",
      color: "from-[#ffb761] to-[#ff9500]",
      bgColor: "bg-gradient-to-br from-[#ffb761]/10 to-[#ff9500]/10",
      borderColor: "border-[#ffb761]/30",
      activeBg: "bg-gradient-to-r from-[#ffb761] to-[#ff9500]",
    },
    {
      id: "breeding",
      label: "Breeding Management",
      icon: Heart,
      description: "Track breeding records and predictions",
      color: "from-[#ff6b35] to-[#ff5722]",
      bgColor: "bg-gradient-to-br from-[#ff6b35]/10 to-[#ff5722]/10",
      borderColor: "border-[#ff6b35]/30",
      activeBg: "bg-gradient-to-r from-[#ff6b35] to-[#ff5722]",
    },
    {
      id: "records",
      label: "Record Keeping",
      icon: History,
      description: "View all changes and activity logs",
      color: "from-[#ff9500] to-[#ffb761]",
      bgColor: "bg-gradient-to-br from-[#ff9500]/10 to-[#ffb761]/10",
      borderColor: "border-[#ff9500]/30",
      activeBg: "bg-gradient-to-r from-[#ff9500] to-[#ffb761]",
    },
  ];

  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#ffb761] via-[#ff9500] to-[#ff6b35] text-white">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6 shadow-xl backdrop-blur-sm">
              <Settings className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Tools Hub
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto leading-relaxed">
              Access Inventory, Breeding Management, and Record Keeping
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = tab === tabItem.id;

            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                  isActive
                    ? `${tabItem.activeBg} text-white shadow-2xl scale-105`
                    : `${tabItem.bgColor} ${tabItem.borderColor} text-gray-700 hover:border-opacity-60`
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-xl ${
                    isActive
                      ? "bg-white/20"
                      : `bg-gradient-to-r ${tabItem.color} text-white`
                  }`}>
                    <Icon size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-bold text-lg ${isActive ? "text-white" : "text-gray-900"}`}>
                      {tabItem.label}
                    </h3>
                  </div>
                </div>
                <p className={`text-sm text-left leading-relaxed ${
                  isActive ? "text-orange-100" : "text-gray-600"
                }`}>
                  {tabItem.description}
                </p>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${tabItem.color}`}></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-orange-100 overflow-hidden">
          <div className="p-8">
            {/* Content Header */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-orange-100">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${activeTab.color} text-white shadow-lg`}>
                <activeTab.icon size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeTab.label}</h2>
                <p className="text-gray-600">{activeTab.description}</p>
              </div>
            </div>

            {/* Page Content */}
            <div className="min-h-[600px]">
              {tab === "inventory" && <InventoryPage />}
              {tab === "breeding" && <BreedingManagementPage />}
              {tab === "records" && <ChangeHistoryPage />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
