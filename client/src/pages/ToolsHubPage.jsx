import React, { useState, useEffect, useCallback, useMemo } from "react";
import InventoryPage from "@/pages/InventoryPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";
import ChangeHistoryPage from "@/pages/ChangeHistoryPage";
import { getAllBreedingLogs } from "@/api/breedingLog";
import { getAllInventoryLogs } from "@/api/inventoryLog";
import { Package, Heart, History, Settings, Globe2, RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Global Logs Tab ──────────────────────────────────────────────────────────
function GlobalLogsTab() {
  const [breedingLogs, setBreedingLogs] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bData, iData] = await Promise.all([
        getAllBreedingLogs(1, 100),
        getAllInventoryLogs(1, 100),
      ]);
      setBreedingLogs((bData.logs || []).map(l => ({ ...l, _type: "breeding" })));
      setInventoryLogs((iData.logs || []).map(l => ({ ...l, _type: "inventory" })));
    } catch (err) {
      console.error("[GlobalLogs] Fetch failed:", err?.response?.data || err?.message || err);
      setError("Could not load logs. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allLogs = useMemo(() =>
    [...breedingLogs, ...inventoryLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [breedingLogs, inventoryLogs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allLogs.filter(l => {
      if (typeFilter !== "all" && l._type !== typeFilter) return false;
      if (!q) return true;
      if (l.sellerName?.toLowerCase().includes(q)) return true;
      if (l._type === "breeding") {
        return (
          l.parent1?.name?.toLowerCase().includes(q) ||
          l.parent2?.name?.toLowerCase().includes(q) ||
          l.offspring?.color?.toLowerCase().includes(q) ||
          l.offspring?.feather?.toLowerCase().includes(q)
        );
      }
      if (l._type === "inventory") {
        return (
          l.itemName?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.action?.toLowerCase().includes(q)
        );
      }
      return false;
    });
  }, [allLogs, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const breedingCount = allLogs.filter(l => l._type === "breeding").length;
  const inventoryCount = allLogs.filter(l => l._type === "inventory").length;
  const handleTypeFilter = (f) => { setTypeFilter(f); setPage(1); };
  const handleSearch = (v) => { setSearch(v); setPage(1); };

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "all", label: `All (${allLogs.length})` },
            { key: "breeding", label: `Breeding (${breedingCount})` },
            { key: "inventory", label: `Inventory (${inventoryCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                typeFilter === key
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search seller, item, breed..."
              className="pl-8 h-8 text-sm border-gray-200 focus:border-emerald-400"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}
            className="border-emerald-200 hover:border-emerald-400 gap-1.5 h-8">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-10 text-sm text-red-500">{error}</div>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-36">Seller</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Details</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3"><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-24 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-full bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-5 w-16 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-14 text-center">
                      <Globe2 size={36} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-400 text-sm">
                        {search || typeFilter !== "all"
                          ? "No logs match your search or filter."
                          : "No activity yet. Post an inventory item or run a breeding prediction."}
                      </p>
                    </td>
                  </tr>
                )}
                {!loading && paginated.map((log) => (
                  <tr key={`${log._type}-${log._id}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Type */}
                    <td className="px-4 py-3">
                      {log._type === "breeding" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                          <Heart size={10} /> Breeding
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                          <Package size={10} /> Inventory
                        </span>
                      )}
                    </td>
                    {/* Seller */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {log.sellerName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-gray-800 truncate">{log.sellerName || "Anonymous"}</span>
                      </div>
                    </td>
                    {/* Details */}
                    <td className="px-4 py-3 text-gray-700">
                      {log._type === "breeding" ? (
                        <span>
                          <span className="font-semibold text-gray-900">{log.parent1?.name || "P1"}</span>
                          <span className="text-gray-400 mx-1">×</span>
                          <span className="font-semibold text-gray-900">{log.parent2?.name || "P2"}</span>
                          <span className="text-gray-400 mx-1.5">→</span>
                          <span className="text-emerald-700">
                            Size {log.offspring?.size ?? "?"}%
                            {" · "}Eggs {log.offspring?.eggProd ?? "?"}%
                            {" · "}{log.offspring?.feather || "smooth"}
                            {" · "}{log.offspring?.color || "white"}
                          </span>
                        </span>
                      ) : (
                        <span>
                          <span className="font-semibold text-gray-900">{log.itemName}</span>
                          <span className="text-gray-400 mx-1.5">·</span>
                          <span className="text-blue-700 font-medium">{log.qty} units</span>
                          <span className="text-gray-400 mx-1.5">·</span>
                          <span className="text-gray-500">{log.category}</span>
                          {log.action && log.action !== "posted" && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 capitalize">{log.action}</span>
                          )}
                          {log.note && (
                            <span className="ml-2 text-xs text-gray-400 italic">{log.note}</span>
                          )}
                        </span>
                      )}
                    </td>
                    {/* Time */}
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {filtered.length} entries · Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-7 px-2 border-gray-200">
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="h-7 px-2 border-gray-200">
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
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
      id: "global-logs",
      label: "Global Logs",
      icon: Globe2,
      description: "Live activity feed of all sellers' breeding & inventory",
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
              Inventory, Breeding Management, Record Keeping &amp; Global Logs
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
              {tab === "global-logs" && <GlobalLogsTab />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
