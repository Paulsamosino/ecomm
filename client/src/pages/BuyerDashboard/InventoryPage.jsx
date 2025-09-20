import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "inventory_v1";
const RECENT_KEY = "recent_purchases_v1";

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const addItem = (n, q) => {
    if (!n) return;
    const trimmed = n.trim();
    if (!trimmed) return;
    setInventory((prev) => {
      const found = prev.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
      if (found) {
        return prev.map((p) => (p.name.toLowerCase() === trimmed.toLowerCase() ? { ...p, qty: Number(p.qty || 0) + Number(q || 0) } : p));
      }
      return [...prev, { id: Date.now().toString(), name: trimmed, qty: Number(q || 0) }];
    });
  };

  const removeItem = (id) => setInventory((prev) => prev.filter((p) => p.id !== id));
  const updateQty = (id, q) => setInventory((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Number(q) } : p)));

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Link to="/buyer-dashboard" className="text-sm text-orange-600">Back</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Add Recent Purchase</h2>
          {recent.length === 0 ? (
            <div className="text-sm text-gray-500">
              No recent purchases found. You can populate recent purchases into localStorage under <code>recent_purchases_v1</code> for quick add. Example:
              <pre className="bg-gray-100 p-2 rounded text-xs mt-2">{`[{"name":"White Leghorn","qty":5}]`}</pre>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-gray-500">Qty: {r.qty || 1}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-orange-600 text-white rounded text-sm" onClick={() => addItem(r.name, r.qty || 1)}>Add</button>
                    <button className="px-3 py-1 bg-gray-100 text-sm rounded" onClick={() => setRecent((prev) => prev.filter((_, idx) => idx !== i))}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-3">Add Manually</h2>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="border px-3 py-2 rounded w-full" />
            <input type="number" value={qty} min={1} onChange={(e) => setQty(Number(e.target.value))} className="w-20 border px-3 py-2 rounded" />
            <button onClick={() => { addItem(name, qty); setName(""); setQty(1); }} className="px-4 bg-orange-600 text-white rounded">Add</button>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Current Inventory</h3>
            {inventory.length === 0 ? (
              <div className="text-sm text-gray-500">No items in inventory yet.</div>
            ) : (
              <div className="space-y-2">
                {inventory.map((it) => (
                  <div key={it.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-500">ID: {it.id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={it.qty} min={0} onChange={(e) => updateQty(it.id, e.target.value)} className="w-20 border px-2 py-1 rounded" />
                      <button onClick={() => removeItem(it.id)} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-xs text-gray-500">Tip: Persist inventory to your backend per-user for multi-device sync. This demo stores inventory in localStorage.</div>
    </div>
  );
}
