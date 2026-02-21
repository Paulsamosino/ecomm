import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  PlusCircle,
  Download,
  Trash2,
  CheckSquare,
  CheckCircle2,
  Search,
  Filter,
  Package,
  Calendar,
  TrendingUp,
  BarChart3,
  Zap,
  ShoppingCart,
  Minus,
  Copy,
  Archive,
  Eye,
  EyeOff,
  Share2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { logInventoryChange } from "@/utils/changeLogger";
import { createInventoryLog, deleteInventoryLog } from "@/api/inventoryLog";

const STORAGE_KEY = "inventory_v2";
const RECENT_KEY = "recent_purchases_v1";

function formatNumber(n) {
  return Number(n || 0);
}

export default function InventoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  // Inline editing: { id, field, value }
  const [inlineEdit, setInlineEdit] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setInventory(Array.isArray(saved) ? saved : []);
    } catch (e) {
      setInventory([]);
    }
    try {
      const rp = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      setRecent(Array.isArray(rp) ? rp : []);
    } catch (e) {
      setRecent([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    } catch (e) {
      // ignore
    }
  }, [inventory]);

  // ─── Global Log Sync: upsert by sourceId (no delete, no race conditions) ───
  const refreshGlobalLog = async (item) => {
    try {
      const created = await createInventoryLog({
        itemName: item.name,
        category: item.category || 'Uncategorized',
        qty: item.qty,
        action: item.archived ? 'archived' : 'posted',
        sourceId: item.id, // server upserts by (user + sourceId)
      });
      return created._id;
    } catch (err) {
      console.warn('[InventoryLog] Refresh failed:', err?.response?.data || err?.message);
      return null;
    }
  };

  // Sync ALL posted items at once
  const syncAllPosted = async () => {
    const posted = inventory.filter(p => p.globalLogId);
    if (posted.length === 0) return;
    setSyncing(true);
    // upsert each — server deduplicates by sourceId, no race conditions
    await Promise.all(posted.map(item => refreshGlobalLog(item)));
    setSyncing(false);
  };

  // Helper: after mutating a posted item, refresh its global log
  const syncIfPosted = async (updatedItem) => {
    if (!updatedItem.globalLogId) return;
    await refreshGlobalLog(updatedItem); // upsert — same _id returned, no state update needed
  };

  const addOrMerge = ({ name: n, qty: q, category: c }) => {
    const trimmed = (n || "").trim();
    if (!trimmed) return;
    const found = inventory.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (found) {
      const newQty = formatNumber(found.qty) + formatNumber(q);
      const updatedItem = { ...found, qty: newQty, category: c || found.category };
      logInventoryChange('update', updatedItem, { previousQty: found.qty, addedQty: q });
      setInventory(prev => prev.map(p => p.name.toLowerCase() === trimmed.toLowerCase() ? updatedItem : p));
      syncIfPosted({ ...updatedItem, globalLogId: found.globalLogId });
    } else {
      const newItem = { id: Date.now().toString(), name: trimmed, qty: formatNumber(q), category: c || "Uncategorized", createdAt: new Date().toISOString() };
      logInventoryChange('add', newItem);
      setInventory(prev => [...prev, newItem]);
    }
  };

  const removeItem = (id) => {
    const it = inventory.find((p) => p.id === id);
    if (!it) return;
    if (!window.confirm(`Remove "${it.name}" from inventory?`)) return;
    logInventoryChange('delete', it);
    if (it.globalLogId) {
      deleteInventoryLog(it.globalLogId)
        .catch(err => console.warn('[InventoryLog] Auto-remove on delete failed:', err?.response?.data || err?.message));
    }
    setInventory((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const startInlineEdit = (id, field, value) => setInlineEdit({ id, field, value });

  const commitInlineEdit = () => {
    if (!inlineEdit) return;
    const { id, field, value } = inlineEdit;
    const trimmed = value.trim();
    if (!trimmed) { setInlineEdit(null); return; }
    const item = inventory.find(p => p.id === id);
    if (!item) { setInlineEdit(null); return; }
    const updatedItem = { ...item, [field]: trimmed };
    logInventoryChange('update', updatedItem, { field });
    setInventory(prev => prev.map(p => p.id === id ? updatedItem : p));
    syncIfPosted({ ...updatedItem, globalLogId: item.globalLogId });
    setInlineEdit(null);
  };

  const cancelInlineEdit = () => setInlineEdit(null);

  const toggleGlobalLog = async (item) => {
    if (item.globalLogId) {
      // Unpost — remove from global logs
      try { await deleteInventoryLog(item.globalLogId); } catch (_) { /* ok */ }
      setInventory(prev => prev.map(p => p.id === item.id ? { ...p, globalLogId: undefined } : p));
    } else {
      // Post — upsert with sourceId
      try {
        const created = await createInventoryLog({
          itemName: item.name,
          category: item.category || 'Uncategorized',
          qty: item.qty,
          action: 'posted',
          sourceId: item.id,
        });
        setInventory(prev => prev.map(p => p.id === item.id ? { ...p, globalLogId: created._id } : p));
      } catch (err) {
        console.warn('[InventoryLog] Post failed:', err?.response?.data || err?.message);
      }
    }
  };



  const updateQty = (id, newQty) => {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    const previousQty = item.qty;
    const parsed = formatNumber(newQty);
    const updatedItem = { ...item, qty: parsed };
    logInventoryChange('update', updatedItem, { previousQty, newQty: parsed });
    setInventory((prev) => prev.map((p) => (p.id === id ? updatedItem : p)));
    syncIfPosted(updatedItem);
  };

  const adjustQty = (id, adjustment) => {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    const previousQty = item.qty;
    const newQty = Math.max(0, formatNumber(item.qty) + adjustment);
    const updatedItem = { ...item, qty: newQty };
    logInventoryChange('update', updatedItem, { previousQty, adjustment, newQty });
    setInventory((prev) => prev.map((p) =>
      p.id === id ? updatedItem : p
    ));
    syncIfPosted(updatedItem);
  };

  const duplicateItem = (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString() + '_copy',
      name: `${item.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    logInventoryChange('duplicate', newItem, { originalItem: item });
    setInventory((prev) => [...prev, newItem]);
  };

  const archiveItem = (id) => {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    const updatedItem = { ...item, archived: true };
    logInventoryChange('archive', updatedItem);
    setInventory((prev) => prev.map((p) =>
      p.id === id ? updatedItem : p
    ));
    syncIfPosted(updatedItem);
  };

  const restoreItem = (id) => {
    const item = inventory.find(p => p.id === id);
    if (!item) return;
    const updatedItem = { ...item, archived: false };
    logInventoryChange('restore', updatedItem);
    setInventory((prev) => prev.map((p) =>
      p.id === id ? updatedItem : p
    ));
    syncIfPosted(updatedItem);
  };

  const exportJSON = () => {
    logInventoryChange('export', { itemCount: inventory.length, filename: `inventory-${new Date().toISOString()}.json` });
    const blob = new Blob([JSON.stringify(inventory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file and merge into inventory
  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (!Array.isArray(imported)) {
            alert('Invalid file format: expected an array of inventory items');
            return;
          }
          setInventory((prev) => {
            const merged = [...prev];
            imported.forEach((it) => {
              if (!it || !it.name) return;
              const existing = merged.find((m) => m.name.toLowerCase() === String(it.name).toLowerCase());
              if (existing) {
                const previousQty = existing.qty;
                existing.qty = formatNumber(existing.qty) + formatNumber(it.qty);
                existing.category = it.category || existing.category;
                logInventoryChange('update', existing, { previousQty, addedQty: it.qty, source: 'import' });
              } else {
                const newItem = {
                  id: it.id || Date.now().toString() + Math.random(),
                  name: it.name,
                  qty: formatNumber(it.qty || 0),
                  category: it.category || 'Uncategorized',
                  createdAt: it.createdAt || new Date().toISOString(),
                };
                merged.push(newItem);
                logInventoryChange('add', newItem, { source: 'import' });
              }
            });
            logInventoryChange('import', { importedCount: imported.length, totalItems: merged.length });
            return merged;
          });
          alert('Import successful');
        } catch (err) {
          alert('Failed to import file: ' + (err && err.message ? err.message : 'invalid JSON'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#ffb761] rounded-full flex items-center justify-center">
              <Package className="text-white" size={32} />
            </div>
            <CardTitle className="text-2xl">Inventory</CardTitle>
            <p className="text-gray-600">Sign in to manage your inventory</p>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categories = useMemo(() => Array.from(new Set(inventory.map((i) => i.category || "Uncategorized"))), [inventory]);
  // active (non-archived) items shown in main table
  const activeVisible = inventory.filter((i) =>
    i.name.toLowerCase().includes(filter.toLowerCase()) &&
    (categoryFilter ? i.category === categoryFilter : true) &&
    !i.archived
  );

  // archived items (shown separately when requested)
  const archivedList = inventory.filter((i) =>
    i.archived &&
    i.name.toLowerCase().includes(filter.toLowerCase()) &&
    (categoryFilter ? i.category === categoryFilter : true)
  );
  const [selected, setSelected] = useState([]);

  // Pagination calculations
  const totalPages = Math.ceil(activeVisible.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = activeVisible.slice(startIndex, endIndex);

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAllVisible = () => setSelected(paginatedItems.map((v) => v.id));
  const clearSelection = () => setSelected([]);
  const bulkRemove = () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Remove ${selected.length} selected items from inventory?`)) return;
    const itemsToRemove = inventory.filter(p => selected.includes(p.id));
    itemsToRemove.forEach(item => {
      logInventoryChange('delete', item, { source: 'bulk_delete' });
      if (item.globalLogId) {
        deleteInventoryLog(item.globalLogId)
          .catch(err => console.warn('[InventoryLog] Bulk auto-remove failed:', err?.response?.data || err?.message));
      }
    });
    logInventoryChange('delete', { count: selected.length }, { source: 'bulk_operation', itemIds: selected });
    setInventory((prev) => prev.filter((p) => !selected.includes(p.id)));
    setSelected([]);
  };

  const totalQty = inventory.reduce((s, it) => s + formatNumber(it.qty), 0);

  const persistRecent = (arr) => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(arr));
    } catch (e) {
      // ignore
    }
  };

  const addRecentAndRemove = (rIndex) => {
    const item = recent[rIndex];
    if (!item) return;
    addOrMerge({ name: item.name, qty: item.qty || 1, category: item.category });
    const next = recent.filter((_, i) => i !== rIndex);
    setRecent(next);
    persistRecent(next);
  };

  const addAllAndClear = () => {
    recent.forEach((r) => addOrMerge({ name: r.name, qty: r.qty || 1, category: r.category }));
    setRecent([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch (e) {
      // ignore
    }
  };

  // Restore all archived items (unarchive)
  const restoreAllArchived = () => {
    if (archivedList.length === 0) return;
    if (!window.confirm(`Restore all ${archivedList.length} archived items?`)) return;
    setInventory((prev) => prev.map((p) => (p.archived ? { ...p, archived: false } : p)));
  };

  // Permanently delete an archived item
  const deleteArchivedPermanently = (id) => {
    const it = inventory.find((p) => p.id === id);
    if (!it) return;
    if (!window.confirm(`Permanently delete archived item "${it.name}"? This cannot be undone.`)) return;
    if (it.globalLogId) {
      deleteInventoryLog(it.globalLogId)
        .catch(err => console.warn('[InventoryLog] Auto-remove on delete failed:', err?.response?.data || err?.message));
    }
    setInventory((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 pt-20 pb-8 px-4">
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#ffb761] to-[#ff9500] rounded-full mb-6 shadow-xl">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#ffb761] via-[#ff9500] to-[#ff6b35] bg-clip-text text-transparent mb-4">
              Inventory Management System
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
              Professional poultry inventory tracking with advanced analytics and management tools
            </p>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#ffb761] to-[#ff9500] border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-semibold mb-1">Total Items</p>
                    <p className="text-white text-3xl font-bold">{inventory.length}</p>
                    <p className="text-orange-200 text-xs mt-1">Active inventory</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <Package className="text-white" size={28} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-[#ff9500] to-[#ff6b35] border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-semibold mb-1">Total Quantity</p>
                    <p className="text-white text-3xl font-bold">{totalQty}</p>
                    <p className="text-orange-200 text-xs mt-1">Units in stock</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <TrendingUp className="text-white" size={28} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-[#ff6b35] to-[#ff5722] border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-semibold mb-1">Categories</p>
                    <p className="text-white text-3xl font-bold">{categories.length}</p>
                    <p className="text-orange-200 text-xs mt-1">Product types</p>
                  </div>
                  <div className="bg-white/20 p-4 rounded-full">
                    <BarChart3 className="text-white" size={28} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity card removed per request */}
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-orange-100 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-[#ffb761] to-[#ff9500] p-3 rounded-xl shadow-lg">
                <Package className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Quick Actions</h3>
                <p className="text-gray-600 text-sm">Manage your inventory efficiently</p>
              </div>
            </div>
            <div className="flex gap-3">
              {inventory.some(p => p.globalLogId) && (
                <Button
                  variant="outline"
                  className="border-2 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 font-semibold text-emerald-600"
                  onClick={syncAllPosted}
                  disabled={syncing}
                >
                  <RefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} size={16} />
                  {syncing ? 'Syncing...' : 'Sync All to Global Logs'}
                </Button>
              )}
              <Button
                variant="outline"
                className="border-2 border-orange-300 hover:border-[#ffb761] hover:bg-[#ffb761]/5 transition-all duration-200 font-semibold"
                onClick={exportJSON}
              >
                <Download className="mr-2" size={16} />
                Export Inventory Data
              </Button>
              <Button
                variant="outline"
                className="border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 font-semibold text-red-600"
                onClick={() => {
                  if (window.confirm('Clear entire inventory? This action cannot be undone.')) {
                    localStorage.removeItem(STORAGE_KEY);
                    setInventory([]);
                  }
                }}
              >
                <Trash2 className="mr-2" size={16} />
                Clear Inventory
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Quick Add & Recent */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Add Card */}
            <Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb761] to-[#ff9500]"></div>
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="bg-gradient-to-r from-[#ffb761] to-[#ff9500] p-3 rounded-lg shadow-lg">
                    <PlusCircle className="text-white" size={22} />
                  </div>
                  Add Inventory Item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-6 pb-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Product Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Premium Layer Feed"
                    className="border-2 border-orange-200 focus:border-[#ffb761] focus:ring-[#ffb761] transition-all duration-200 bg-orange-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Stock Quantity</label>
                    <Input
                      type="number"
                      value={qty}
                      min={0}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="border-2 border-orange-200 focus:border-[#ffb761] focus:ring-[#ffb761] transition-all duration-200 bg-orange-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Category</label>
                    <Input
                      placeholder="e.g. Feed"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border-2 border-orange-200 focus:border-[#ffb761] focus:ring-[#ffb761] transition-all duration-200 bg-orange-50/50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#ffb761] to-[#ff9500] hover:from-[#ff9500] hover:to-[#ffb761] text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={() => {
                      addOrMerge({ name, qty, category: categoryFilter });
                      setName('');
                      setQty(1);
                      setCategoryFilter('');
                    }}
                  >
                    <PlusCircle className="mr-2" size={16} />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-orange-300 hover:border-[#ffb761] hover:bg-[#ffb761]/5 transition-all duration-200"
                    onClick={() => {
                      setName('');
                      setQty(1);
                      setCategoryFilter('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Purchases Card */}
            <Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff9500] to-[#ff6b35]"></div>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="bg-gradient-to-r from-[#ff9500] to-[#ff6b35] p-3 rounded-lg shadow-lg">
                    <ShoppingCart className="text-white" size={22} />
                  </div>
                  Recent Stock Additions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {recent.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="bg-gradient-to-r from-orange-100 to-orange-200 p-4 rounded-full w-fit mx-auto mb-4">
                      <Package className="text-orange-400" size={32} />
                    </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">No recent stock additions</p>
                    <p className="text-xs text-gray-500">Items will appear here after checkout</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-[#ff9500] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#ff9500] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300"
                        onClick={addAllAndClear}
                      >
                        <CheckSquare className="mr-2" size={14} />
                        Add All Items to Inventory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-orange-300 hover:border-red-400 hover:bg-red-50 transition-all duration-200"
                        onClick={() => {
                          if (window.confirm('Clear recent stock items?')) {
                            localStorage.removeItem(RECENT_KEY);
                            setRecent([]);
                          }
                        }}
                      >
                        Clear Recent Items
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {recent.map((r, i) => (
                        <div key={i} className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all duration-200 border border-orange-200 hover:border-orange-300 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900 mb-1">{r.name}</div>
                              <div className="text-xs text-gray-600">
                                Stock: {r.qty || 1} • {r.category || 'Uncategorized'}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addRecentAndRemove(i)}
                                className="h-8 w-8 p-0 bg-green-100 hover:bg-green-200 text-green-700 transition-all duration-200"
                              >
                                <CheckCircle2 size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Remove this item from recent stock?')) {
                                    const next = recent.filter((_, idx) => idx !== i);
                                    setRecent(next);
                                    persistRecent(next);
                                  }
                                }}
                                className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200 text-red-700 transition-all duration-200"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters and Actions */}
            <Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 mb-8">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb761] via-[#ff9500] to-[#ff6b35]"></div>
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-gradient-to-r from-[#ffb761] to-[#ff9500] p-3 rounded-xl shadow-lg">
                      <Search className="text-white" size={20} />
                    </div>
                    <Input
                      placeholder="Search inventory items..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="flex-1 border-2 border-orange-200 focus:border-[#ffb761] focus:ring-[#ffb761] transition-all duration-200 text-lg py-3 bg-orange-50/50"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-r from-[#ff9500] to-[#ff6b35] p-3 rounded-xl shadow-lg">
                      <Filter className="text-white" size={20} />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border-2 border-orange-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#ffb761] focus:border-[#ffb761] transition-all duration-200 text-lg bg-orange-50/50"
                    >
                      <option value="">All Categories</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      onClick={() => setShowArchived(!showArchived)}
                      className={`border-2 px-4 py-3 transition-all duration-200 text-sm font-semibold ${
                        showArchived
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {showArchived ? <EyeOff size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
                      {showArchived ? 'Hide Archived' : 'Show Archived'}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="border-2 border-orange-300 hover:border-[#ffb761] hover:bg-[#ffb761]/5 transition-all duration-200 font-semibold px-6 py-3"
                    onClick={selectAllVisible}
                  >
                                        Select All Items
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-orange-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 font-semibold px-6 py-3"
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={bulkRemove}
                    disabled={selected.length === 0}
                    className={`border-2 font-semibold px-6 py-3 transition-all duration-200 ${
                      selected.length === 0
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600'
                    }`}
                  >
                    Remove Selected Items ({selected.length})
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#ff6b35] to-[#e65100] hover:from-[#e65100] hover:to-[#ff6b35] text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    onClick={exportJSON}
                  >
                    <Download className="mr-2" size={16} />
                    Export Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card className="relative overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ffb761] to-[#ff9500]"></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-orange-50 to-amber-50">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selected.length === paginatedItems.length && paginatedItems.length > 0}
                          onChange={selectAllVisible}
                          className="w-5 h-5 text-[#ffb761] bg-orange-50 border-2 border-orange-300 rounded focus:ring-[#ffb761] focus:ring-2 transition-all duration-200"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Item Name</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Stock Quantity</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Date Added</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((it) => (
                      <tr key={it.id} className={`border-b border-orange-100 hover:bg-orange-50/50 transition-all duration-200 ${
                        selected.includes(it.id) ? 'bg-[#ffb761]/5 border-[#ffb761]/20' : ''
                      }`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selected.includes(it.id)}
                            onChange={() => toggleSelect(it.id)}
                            className="w-5 h-5 text-[#ffb761] bg-orange-50 border-2 border-orange-300 rounded focus:ring-[#ffb761] focus:ring-2 transition-all duration-200"
                          />
                        </td>
                        <td className="px-6 py-4 group" onDoubleClick={() => startInlineEdit(it.id, 'name', it.name)} title="Double-click to edit">
                          {inlineEdit?.id === it.id && inlineEdit.field === 'name' ? (
                            <input
                              autoFocus
                              className="font-semibold text-gray-900 text-lg border-b-2 border-[#ffb761] bg-transparent outline-none w-full min-w-[100px]"
                              value={inlineEdit.value}
                              onChange={e => setInlineEdit(ie => ({ ...ie, value: e.target.value }))}
                              onBlur={commitInlineEdit}
                              onKeyDown={e => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') cancelInlineEdit(); }}
                            />
                          ) : (
                            <div className="font-semibold text-gray-900 text-lg cursor-text group-hover:text-[#ff9500] transition-colors">
                              {it.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 group" onDoubleClick={() => startInlineEdit(it.id, 'category', it.category || 'Uncategorized')} title="Double-click to edit">
                          {inlineEdit?.id === it.id && inlineEdit.field === 'category' ? (
                            <>
                              <input
                                autoFocus
                                list="inline-category-suggestions"
                                className="border-b-2 border-[#ffb761] bg-transparent outline-none text-sm font-semibold text-[#8B4513] w-full min-w-[80px]"
                                value={inlineEdit.value}
                                onChange={e => setInlineEdit(ie => ({ ...ie, value: e.target.value }))}
                                onBlur={commitInlineEdit}
                                onKeyDown={e => { if (e.key === 'Enter') commitInlineEdit(); if (e.key === 'Escape') cancelInlineEdit(); }}
                              />
                              <datalist id="inline-category-suggestions">
                                {categories.map(c => <option key={c} value={c} />)}
                              </datalist>
                            </>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold cursor-text ${
                              selected.includes(it.id)
                                ? 'bg-[#ffb761]/20 text-[#8B4513]'
                                : 'bg-gradient-to-r from-[#ffb761]/10 to-[#ff9500]/10 text-[#8B4513]'
                            }`}>
                              {it.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => adjustQty(it.id, -1)}
                              disabled={it.qty <= 0}
                              className="h-8 w-8 p-0 border-orange-300 hover:border-red-400 hover:bg-red-50"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={it.qty}
                              min={0}
                              onChange={(e) => updateQty(it.id, e.target.value)}
                              className="w-16 text-center border-2 border-orange-200 focus:border-[#ffb761] focus:ring-[#ffb761] transition-all duration-200 font-bold text-base bg-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => adjustQty(it.id, 1)}
                              className="h-8 w-8 p-0 bg-gradient-to-r from-[#ffb761] to-[#ff9500] hover:from-[#ff9500] hover:to-[#ffb761] text-white"
                            >
                              <PlusCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {it.archived ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                <Archive className="w-3 h-3 mr-1" />
                                Archived
                              </span>
                            ) : it.qty === 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                Out of Stock
                              </span>
                            ) : it.qty <= 5 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-600">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                                In Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar size={16} className="text-[#ffb761]" />
                            <span className="font-medium">{new Date(it.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleGlobalLog(it)}
                              className={`transition-all duration-200 h-8 w-8 p-0 rounded-full ${
                                it.globalLogId
                                  ? "text-emerald-600 bg-emerald-100 hover:bg-emerald-200"
                                  : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={it.globalLogId ? "Remove from Global Logs" : "Post to Global Logs"}
                            >
                              <Share2 size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => duplicateItem(it)}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 h-8 w-8 p-0 rounded-full"
                              title="Duplicate Item"
                            >
                              <Copy size={14} />
                            </Button>
                            {it.archived ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => restoreItem(it.id)}
                                className="text-green-500 hover:text-green-700 hover:bg-green-50 transition-all duration-200 h-8 w-8 p-0 rounded-full"
                                title="Restore Item"
                              >
                                <Eye size={14} />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => archiveItem(it.id)}
                                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 transition-all duration-200 h-8 w-8 p-0 rounded-full"
                                title="Archive Item"
                              >
                                <Archive size={14} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(it.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200 h-8 w-8 p-0 rounded-full"
                              title="Delete Item"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paginatedItems.length === 0 && (
                <div className="p-16 text-center">
                  <div className="bg-gradient-to-r from-orange-200 to-orange-300 p-6 rounded-full w-fit mx-auto mb-6 shadow-lg">
                    <Package className="text-orange-500" size={48} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Inventory is Empty</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                    Start building your poultry inventory by adding items using the Quick Add section or from your recent purchases.
                  </p>
                    <div className="flex justify-center gap-6">
                    <Button className="bg-gradient-to-r from-[#ffb761] to-[#ff9500] hover:from-[#ff9500] hover:to-[#ffb761] text-white font-semibold px-10 py-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      onClick={() => document.querySelector('.lg\\:col-span-1')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Add Your First Item
                    </Button>
                    <Button variant="outline" className="border-2 border-orange-300 hover:border-[#ffb761] hover:bg-[#ffb761]/5 font-semibold px-10 py-5 transition-all duration-200"
                      onClick={importData}
                    >
                      Import Inventory Data
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-orange-200">
                <div className="flex items-center gap-4 text-sm text-orange-700">
                  <span>Showing {startIndex + 1} to {Math.min(endIndex, activeVisible.length)} of {activeVisible.length} entries</span>
                  <div className="flex items-center gap-2">
                    <label className="text-orange-700">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="text-sm border border-orange-300 rounded-md px-2 py-1 bg-white text-orange-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md transition-all duration-200"
                  >
                    ← Previous
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {(() => {
                      const pages = [];
                      const showEllipsis = totalPages > 7;

                      if (!showEllipsis) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Always show first page
                        pages.push(1);

                        if (currentPage > 4) {
                          pages.push('...');
                        }

                        // Show pages around current page
                        const start = Math.max(2, currentPage - 1);
                        const end = Math.min(totalPages - 1, currentPage + 1);

                        for (let i = start; i <= end; i++) {
                          if (!pages.includes(i)) {
                            pages.push(i);
                          }
                        }

                        if (currentPage < totalPages - 3) {
                          pages.push('...');
                        }

                        // Always show last page
                        if (!pages.includes(totalPages)) {
                          pages.push(totalPages);
                        }
                      }

                      return pages.map((pageNum, index) => {
                        if (pageNum === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="px-2 py-2 text-orange-400">
                              ...
                            </span>
                          );
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-md transition-all duration-200 ${
                              currentPage === pageNum
                                ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                                : "border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded-md transition-all duration-200"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Archived Items Section */}
            {showArchived && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Archived Items</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={restoreAllArchived} className="px-4 py-2">Restore All</Button>
                  </div>
                </div>
                <Card className="bg-white/95 border-0 shadow-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-6 py-3 text-left">Item</th>
                          <th className="px-6 py-3 text-left">Category</th>
                          <th className="px-6 py-3 text-left">Qty</th>
                          <th className="px-6 py-3 text-left">Date</th>
                          <th className="px-6 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedList.map((it) => (
                          <tr key={it.id} className="border-b border-orange-100">
                            <td className="px-6 py-4 font-semibold text-gray-900">{it.name}</td>
                            <td className="px-6 py-4"><span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-[#ffb761]/10 to-[#ff9500]/10 text-[#8B4513]">{it.category}</span></td>
                            <td className="px-6 py-4">{it.qty}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(it.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => restoreItem(it.id)} className="text-green-600 h-8 w-8 p-0 rounded-full"><Eye size={14} /></Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteArchivedPermanently(it.id)} className="text-red-600 h-8 w-8 p-0 rounded-full"><Trash2 size={14} /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {archivedList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-sm text-gray-500">No archived items</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
