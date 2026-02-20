import React, { useState, useEffect, useCallback } from "react";
import InventoryPage from "@/pages/InventoryPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";
import ChangeHistoryPage from "@/pages/ChangeHistoryPage";
import { getAllBreedingLogs } from "@/api/breedingLog";
import { Package, Heart, History, Settings, Activity, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COLOR_CHIP_MAP = {
  black: "#0F172A", brown: "#7F2A2A", red: "#E11D48",
  white: "#F8FAFC", gold: "#F59E0B",
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function TraitBadge({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-100 rounded-full text-xs text-gray-700">
      <span className="text-gray-400">{label}:</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

function LogCard({ log }) {
  const offspringColor = COLOR_CHIP_MAP[log.offspring?.color?.toLowerCase()] || "#F8FAFC";
  return (
    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow">
          {log.sellerName?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{log.sellerName || "Anonymous"}</p>
          <p className="text-xs text-gray-400">{timeAgo(log.createdAt)}</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-orange-500 font-medium bg-orange-50 px-2.5 py-1 rounded-full">
          <Heart size={12} /> Breeding
        </span>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-amber-50 rounded-xl p-3 min-w-0">
          <p className="text-xs text-gray-400 mb-1">Parent 1</p>
          <p className="font-semibold text-gray-800 text-sm truncate">{log.parent1?.name || "Parent 1"}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <TraitBadge label="Size" value={`${log.parent1?.size ?? 50}%`} />
            <TraitBadge label="Eggs" value={`${log.parent1?.eggProd ?? 50}%`} />
          </div>
        </div>
        <span className="text-orange-400 font-light text-xl">×</span>
        <div className="flex-1 bg-amber-50 rounded-xl p-3 min-w-0">
          <p className="text-xs text-gray-400 mb-1">Parent 2</p>
          <p className="font-semibold text-gray-800 text-sm truncate">{log.parent2?.name || "Parent 2"}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <TraitBadge label="Size" value={`${log.parent2?.size ?? 50}%`} />
            <TraitBadge label="Eggs" value={`${log.parent2?.eggProd ?? 50}%`} />
          </div>
        </div>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3.5 h-3.5 rounded-full border shadow-sm" style={{ background: offspringColor }} />
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Predicted Offspring</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TraitBadge label="Size" value={`${log.offspring?.size ?? 50}%`} />
          <TraitBadge label="Eggs" value={`${log.offspring?.eggProd ?? 50}%`} />
          <TraitBadge label="Feather" value={log.offspring?.feather || "smooth"} />
          <TraitBadge label="Color" value={log.offspring?.color || "white"} />
        </div>
      </div>
    </div>
  );
}

function BreederLogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBreedingLogs(p, 10);
      setLogs(data.logs || []);
      setTotalPages(data.pages || 1);
      setPage(p);
    } catch (err) {
      console.error("[BreederLogs] Fetch failed:", err?.response?.data || err?.message || err);
      setError("Could not load breeding logs. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Global Breeder Logs</h3>
          <p className="text-sm text-gray-500">Live feed of breeding activity across all sellers</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs(page)} disabled={loading}
          className="border-orange-200 hover:border-orange-400 gap-1.5">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-44 animate-pulse" />)}
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-16">
          <Activity className="text-orange-300 mx-auto mb-3" size={48} />
          <p className="text-gray-600">{error}</p>
        </div>
      )}
      {!loading && !error && logs.length === 0 && (
        <div className="text-center py-16">
          <Heart className="text-orange-300 mx-auto mb-4" size={56} />
          <h4 className="text-xl font-semibold text-gray-800 mb-2">No breeding activity yet</h4>
          <p className="text-gray-500">Run a prediction in the Breeding Management tab to appear here.</p>
        </div>
      )}
      {!loading && !error && logs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {logs.map((log) => <LogCard key={log._id} log={log} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)} className="border-orange-200">
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)} className="border-orange-200">
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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
    {
      id: "breeder-logs",
      label: "Breeder Logs",
      icon: Activity,
      description: "Global feed of breeding activity from all sellers",
      color: "from-[#10b981] to-[#059669]",
      bgColor: "bg-gradient-to-br from-[#10b981]/10 to-[#059669]/10",
      borderColor: "border-[#10b981]/30",
      activeBg: "bg-gradient-to-r from-[#10b981] to-[#059669]",
    },
  ];

  const activeTab = tabs.find(t => t.id === tab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#ffb761] via-[#ff9500] to-[#ff6b35] text-white">
        <div className="px-2 sm:px-4 lg:px-6 py-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3 shadow-xl backdrop-blur-sm">
              <Settings className="text-white" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Tools Hub
            </h1>
            <p className="text-base text-orange-100 max-w-2xl mx-auto leading-relaxed">
              Inventory, Breeding Management, Record Keeping &amp; Breeder Logs
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-2 sm:px-4 lg:px-6 -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = tab === tabItem.id;

            return (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`relative p-3.5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-[1.03] hover:shadow-lg text-left ${
                  isActive
                    ? `${tabItem.activeBg} text-white shadow-xl scale-[1.03]`
                    : `${tabItem.bgColor} ${tabItem.borderColor} text-gray-700 hover:border-opacity-60`
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isActive
                      ? "bg-white/20"
                      : `bg-gradient-to-r ${tabItem.color} text-white`
                  }`}>
                    <Icon size={18} />
                  </div>
                  <h3 className={`font-bold text-sm leading-tight ${
                    isActive ? "text-white" : "text-gray-900"
                  }`}>
                    {tabItem.label}
                  </h3>
                </div>
                <p className={`text-xs leading-snug pl-0.5 ${
                  isActive ? "text-white/80" : "text-gray-500"
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
          <div className="p-5">
            {/* Content Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-100">
              <div className={`p-2.5 rounded-xl bg-gradient-to-r ${activeTab.color} text-white shadow-md`}>
                <activeTab.icon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{activeTab.label}</h2>
                <p className="text-sm text-gray-500">{activeTab.description}</p>
              </div>
            </div>

            {/* Page Content */}
            <div className="min-h-[600px]">
              {tab === "inventory" && <InventoryPage />}
              {tab === "breeding" && <BreedingManagementPage />}
              {tab === "records" && <ChangeHistoryPage />}
              {tab === "breeder-logs" && <BreederLogsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
