import React, { useState, useEffect, useCallback, useMemo } from "react";
import InventoryPage from "@/pages/InventoryPage";
import BreedingManagementPage from "@/pages/BreedingManagementPage";
import ChangeHistoryPage from "@/pages/ChangeHistoryPage";
import { getAllBreedingLogs } from "@/api/breedingLog";
import { getAllInventoryLogs } from "@/api/inventoryLog";
import { Package, Heart, History, Settings, Globe2, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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

function eggRange(pct) {
  const base = Math.round((pct ?? 0) / 100 * 7);
  const low  = Math.max(0, base - 1);
  const high = Math.min(7, base + 1);
  return low === high ? `~${low}/wk` : `${low}–${high}/wk`;
}

// ─── Global Logs Tab ──────────────────────────────────────────────────────────
function GlobalLogsTab() {
  const [breedingLogs, setBreedingLogs] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breedSearch, setBreedSearch] = useState("");
  const [invSearch, setInvSearch] = useState("");
  const [breedPage, setBreedPage] = useState(1);
  const [invPage, setInvPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null); // { type: 'breeding'|'inventory', data: {} }
  const PAGE = 10;

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [bData, iData] = await Promise.all([
        getAllBreedingLogs(1, 100),
        getAllInventoryLogs(1, 100),
      ]);
      setBreedingLogs(bData.logs || []);
      setInventoryLogs(iData.logs || []);
    } catch (err) {
      console.error("[GlobalLogs] Fetch failed:", err?.response?.data || err?.message || err);
      if (!silent) setError("Could not load logs. Please try refreshing.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh: re-fetch when document becomes visible again (user switches tabs)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchAll]);

  // Auto-poll every 2 seconds — real-time updates
  useEffect(() => {
    const id = setInterval(() => fetchAll(true), 2000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const filteredBreeding = useMemo(() => {
    const q = breedSearch.toLowerCase().trim();
    if (!q) return breedingLogs;
    return breedingLogs.filter(l =>
      l.sellerName?.toLowerCase().includes(q) ||
      l.parent1?.name?.toLowerCase().includes(q) ||
      l.parent2?.name?.toLowerCase().includes(q) ||
      l.offspring?.feather?.toLowerCase().includes(q) ||
      l.offspring?.color?.toLowerCase().includes(q)
    );
  }, [breedingLogs, breedSearch]);

  const filteredInventory = useMemo(() => {
    const q = invSearch.toLowerCase().trim();
    if (!q) return inventoryLogs;
    return inventoryLogs.filter(l =>
      l.sellerName?.toLowerCase().includes(q) ||
      l.itemName?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  }, [inventoryLogs, invSearch]);

  const bTotalPages = Math.max(1, Math.ceil(filteredBreeding.length / PAGE));
  const bSafePage   = Math.min(breedPage, bTotalPages);
  const bRows       = filteredBreeding.slice((bSafePage - 1) * PAGE, bSafePage * PAGE);

  const iTotalPages = Math.max(1, Math.ceil(filteredInventory.length / PAGE));
  const iSafePage   = Math.min(invPage, iTotalPages);
  const iRows       = filteredInventory.slice((iSafePage - 1) * PAGE, iSafePage * PAGE);

  const SkeletonRows = ({ cols }) => (
    [...Array(4)].map((_, i) => (
      <tr key={i} className="border-b border-gray-100">
        {[...Array(cols)].map((__, c) => (
          <td key={c} className="px-3 py-2.5">
            <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: c === 0 ? "80%" : "60%" }} />
          </td>
        ))}
      </tr>
    ))
  );

  if (error) return (
    <div className="text-center py-14 text-sm text-red-400">{error}</div>
  );

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe2 size={16} className="text-emerald-500" />
          <span className="text-sm font-semibold text-gray-700">
            {breedingLogs.length + inventoryLogs.length} total entries
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* ── LEFT: Breeding Logs ── */}
        <div className="flex flex-col rounded-xl border border-rose-100 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-rose-50 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-rose-500" />
              <span className="text-sm font-bold text-rose-700">Breeding Logs</span>
              <span className="text-xs text-rose-400 font-medium">({breedingLogs.length})</span>
            </div>
            <div className="relative w-44">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={breedSearch} onChange={e => { setBreedSearch(e.target.value); setBreedPage(1); }}
                placeholder="Search..." className="pl-7 h-7 text-xs border-rose-200 focus:border-rose-400"
                list="breed-seller-suggestions" />
              <datalist id="breed-seller-suggestions">
                {[...new Set(breedingLogs.map(l => l.sellerName).filter(Boolean))].map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Seller</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Parents</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Offspring</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 w-16">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows cols={4} /> : bRows.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-gray-400">
                    {breedSearch ? "No matches." : "No breeding activity yet."}
                  </td></tr>
                ) : bRows.map(log => (
                  <tr key={log._id} onClick={() => setSelectedLog({ type: 'breeding', data: log })} className="border-b border-gray-100 hover:bg-rose-50/60 cursor-pointer transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {log.sellerName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[80px]">{log.sellerName || "Anon"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">
                      <span className="font-semibold text-gray-900">{log.parent1?.name || "P1"}</span>
                      <span className="text-gray-400 mx-1">×</span>
                      <span className="font-semibold text-gray-900">{log.parent2?.name || "P2"}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {log.offspring?.name && (
                        <div className="font-semibold text-gray-900 text-sm mb-0.5">{log.offspring.name}</div>
                      )}
                      <div className="text-emerald-700 leading-relaxed text-xs">
                        <span>{log.offspring?.size ?? "?"}% size</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span>{eggRange(log.offspring?.eggProd)}</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="capitalize">{log.offspring?.feather || "smooth"}</span>
                        <span className="text-gray-300 mx-1">·</span>
                        <span className="capitalize">{log.offspring?.color || "white"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && bTotalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-rose-100 bg-rose-50/30">
              <span className="text-[11px] text-gray-400">Page {bSafePage}/{bTotalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={bSafePage <= 1}
                  onClick={() => setBreedPage(p => p - 1)} className="h-6 w-6 p-0 border-rose-200">
                  <ChevronLeft size={12} />
                </Button>
                <Button variant="outline" size="sm" disabled={bSafePage >= bTotalPages}
                  onClick={() => setBreedPage(p => p + 1)} className="h-6 w-6 p-0 border-rose-200">
                  <ChevronRight size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Inventory Logs ── */}
        <div className="flex flex-col rounded-xl border border-blue-100 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-blue-500" />
              <span className="text-sm font-bold text-blue-700">Inventory Logs</span>
              <span className="text-xs text-blue-400 font-medium">({inventoryLogs.length})</span>
            </div>
            <div className="relative w-44">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={invSearch} onChange={e => { setInvSearch(e.target.value); setInvPage(1); }}
                placeholder="Search..." className="pl-7 h-7 text-xs border-blue-200 focus:border-blue-400"
                list="inv-search-suggestions" />
              <datalist id="inv-search-suggestions">
                {[...new Set([
                  ...inventoryLogs.map(l => l.sellerName),
                  ...inventoryLogs.map(l => l.itemName),
                  ...inventoryLogs.map(l => l.category),
                ].filter(Boolean))].map(val => (
                  <option key={val} value={val} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Product Name</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Stock Qty</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Category</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Seller</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500 w-16">Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <SkeletonRows cols={5} /> : iRows.length === 0 ? (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-gray-400">
                    {invSearch ? "No matches." : "No inventory posts yet. Hit the Post button on an inventory item."}
                  </td></tr>
                ) : iRows.map(log => (
                  <tr key={log._id} onClick={() => setSelectedLog({ type: 'inventory', data: log })} className="border-b border-gray-100 hover:bg-blue-50/60 cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 font-semibold text-gray-900">{log.itemName}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                        {log.qty}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 capitalize">
                        {log.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {log.sellerName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium text-gray-800 truncate max-w-[80px]">{log.sellerName || "Anon"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && iTotalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-blue-100 bg-blue-50/30">
              <span className="text-[11px] text-gray-400">Page {iSafePage}/{iTotalPages}</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={iSafePage <= 1}
                  onClick={() => setInvPage(p => p - 1)} className="h-6 w-6 p-0 border-blue-200">
                  <ChevronLeft size={12} />
                </Button>
                <Button variant="outline" size="sm" disabled={iSafePage >= iTotalPages}
                  onClick={() => setInvPage(p => p + 1)} className="h-6 w-6 p-0 border-blue-200">
                  <ChevronRight size={12} />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
      {/* ── Detail Modal ── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {selectedLog.type === 'breeding' ? (
              <>
                {/* Breeding modal */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 bg-rose-50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Heart size={15} className="text-rose-500" />
                    <span className="font-bold text-rose-700">Breeding Log</span>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="p-1 rounded-full hover:bg-rose-100 text-rose-400 transition">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Seller */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {selectedLog.data.sellerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Seller</p>
                      <p className="font-semibold text-gray-900">{selectedLog.data.sellerName || 'Anonymous'}</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{timeAgo(selectedLog.data.createdAt)}</span>
                  </div>
                  {/* Parents */}
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Parent 1', p: selectedLog.data.parent1 }, { label: 'Parent 2', p: selectedLog.data.parent2 }].map(({ label, p }) => (
                      <div key={label} className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <p className="text-[10px] text-rose-400 font-semibold mb-1">{label}</p>
                        <p className="font-bold text-gray-900 text-sm mb-1">{p?.name || '—'}</p>
                        <p className="text-xs text-gray-500">Size: {p?.size ?? '?'}%</p>
                        <p className="text-xs text-gray-500">Eggs: {p?.eggProd ?? '?'}% ({eggRange(p?.eggProd)})</p>
                        <p className="text-xs text-gray-500 capitalize">Feather: {p?.feather || '—'}</p>
                        <p className="text-xs text-gray-500 capitalize">Color: {p?.color || '—'}</p>
                      </div>
                    ))}
                  </div>
                  {/* Offspring */}
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    <p className="text-[10px] text-emerald-500 font-semibold mb-2">PREDICTED OFFSPRING</p>
                    {selectedLog.data.offspring?.name && (
                      <p className="font-bold text-gray-900 text-base mb-2">{selectedLog.data.offspring.name}</p>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-gray-500">Size</span>
                      <span className="font-semibold text-gray-900">{selectedLog.data.offspring?.size ?? '?'}%</span>
                      <span className="text-gray-500">Egg Production</span>
                      <span className="font-semibold text-emerald-700">{selectedLog.data.offspring?.eggProd ?? '?'}% · {eggRange(selectedLog.data.offspring?.eggProd)}</span>
                      <span className="text-gray-500">Feather</span>
                      <span className="font-semibold text-gray-900 capitalize">{selectedLog.data.offspring?.feather || '—'}</span>
                      <span className="text-gray-500">Color</span>
                      <span className="font-semibold text-gray-900 capitalize">{selectedLog.data.offspring?.color || '—'}</span>
                    </div>
                  </div>
                  {selectedLog.data.notes && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm text-gray-600 italic">
                      {selectedLog.data.notes}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Inventory modal */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-blue-100 bg-blue-50 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Package size={15} className="text-blue-500" />
                    <span className="font-bold text-blue-700">Inventory Log</span>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="p-1 rounded-full hover:bg-blue-100 text-blue-400 transition">
                    <X size={16} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Seller */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {selectedLog.data.sellerName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Posted by</p>
                      <p className="font-semibold text-gray-900">{selectedLog.data.sellerName || 'Anonymous'}</p>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{timeAgo(selectedLog.data.createdAt)}</span>
                  </div>
                  {/* Item details */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[10px] text-blue-400 font-semibold mb-0.5">PRODUCT NAME</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedLog.data.itemName}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold border border-blue-200 capitalize">
                        {selectedLog.data.action || 'posted'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">STOCK QTY</p>
                        <p className="text-2xl font-bold text-blue-700">{selectedLog.data.qty}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-orange-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">CATEGORY</p>
                        <p className="text-sm font-bold text-orange-700 capitalize">{selectedLog.data.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                  </div>
                  {selectedLog.data.note && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm text-gray-600 italic">
                      {selectedLog.data.note}
                    </div>
                  )}
                </div>
              </>
            )}
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
