import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { createVoucher } from "@/api/vouchers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * AdminVouchers
 * - Improved form layout, inline validation, and nicer buttons.
 * - Keeps existing voucher list fetch/create behaviour.
 */
const AdminVouchers = () => {
  const { user } = useAuth();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // Inline validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user?.isAdmin) return;
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getToken = () => localStorage.getItem("token");

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/vouchers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch vouchers");
      const data = await res.json();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const next = {};
    if (!code.trim()) next.code = "Code is required";
    if (!discount.toString().trim()) {
      next.discount = "Discount is required";
    } else if (Number.isNaN(Number(discount)) || Number(discount) <= 0) {
      next.discount = "Discount must be a positive number";
    }
    if (minTotal.toString().trim()) {
      if (Number.isNaN(Number(minTotal)) || Number(minTotal) < 0) {
        next.minTotal = "Minimum total must be 0 or greater";
      }
    }
    if (expiresAt && isNaN(new Date(expiresAt).getTime())) {
      next.expiresAt = "Invalid date";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = getToken();
    if (!token) return toast.error("Missing auth token");

    const payload = {
      code: code.trim(),
      // server expects a 'type' and 'amount' per Voucher model
      // use type: "amount" for fixed currency discount
      type: "amount",
      amount: Number(discount),
      minTotal: minTotal ? Number(minTotal) : 0,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    };

    setCreating(true);
    try {
      await createVoucher(payload, token);
      toast.success("Voucher created");
      // reset
      setCode("");
      setDiscount("");
      setMinTotal("");
      setExpiresAt("");
      setErrors({});
      fetchVouchers();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create voucher");
    } finally {
      setCreating(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Vouchers</h1>
        <p className="text-sm text-gray-600 mt-2">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Vouchers (Admin)</h1>

      <section className="mb-6 p-4 border rounded bg-white shadow-sm">
        <h2 className="font-medium mb-3">Create voucher</h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-12 gap-3 items-center">
            <label className="col-span-3 text-sm text-gray-700">Code</label>
            <div className="col-span-9">
              <input
                className={`w-full px-3 py-2 border rounded focus:outline-none ${
                  errors.code ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Code (e.g. SAVE10)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onBlur={validateForm}
              />
              {errors.code && <div className="text-xs text-red-600 mt-1">{errors.code}</div>}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <label className="col-span-3 text-sm text-gray-700">Discount</label>
            <div className="col-span-9 flex gap-3">
              <input
                className={`flex-1 px-3 py-2 border rounded focus:outline-none ${
                  errors.discount ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Numeric value (e.g. 10 for ₱10 off)"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onBlur={validateForm}
              />
              <div className="text-sm text-gray-500 self-center">₱</div>
            </div>
            {errors.discount && <div className="col-start-4 col-span-9 text-xs text-red-600">{errors.discount}</div>}
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <label className="col-span-3 text-sm text-gray-700">Min cart total</label>
            <div className="col-span-9">
              <input
                className={`w-full px-3 py-2 border rounded focus:outline-none ${
                  errors.minTotal ? "border-red-400" : "border-gray-200"
                }`}
                placeholder="Optional - minimum cart total to apply voucher"
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                onBlur={validateForm}
              />
              {errors.minTotal && <div className="text-xs text-red-600 mt-1">{errors.minTotal}</div>}
            </div>
          </div>

          <div className="grid grid-cols-12 gap-3 items-center">
            <label className="col-span-3 text-sm text-gray-700">Expires</label>
            <div className="col-span-9">
              <input
                type="date"
                className={`w-48 px-3 py-2 border rounded focus:outline-none ${
                  errors.expiresAt ? "border-red-400" : "border-gray-200"
                }`}
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                onBlur={validateForm}
              />
              {errors.expiresAt && <div className="text-xs text-red-600 mt-1">{errors.expiresAt}</div>}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={creating || Object.keys(errors).length > 0}
              className="px-4 py-2 bg-orange-600 text-white rounded shadow hover:bg-orange-700 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create voucher"}
            </button>

            <button
              type="button"
              onClick={() => {
                setCode("");
                setDiscount("");
                setMinTotal("");
                setExpiresAt("");
                setErrors({});
              }}
              className="px-4 py-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
            >
              Reset
            </button>

            <div className="ml-auto text-sm text-gray-500">
              Tip: set an expiry date to automatically disable old vouchers.
            </div>
          </div>
        </form>
      </section>

      <section className="p-4 border rounded bg-white shadow-sm">
        <h2 className="font-medium mb-3">Existing vouchers</h2>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : vouchers.length === 0 ? (
          <div className="text-sm text-gray-600">No vouchers found.</div>
        ) : (
          <div className="space-y-2">
            {vouchers.map((v) => (
              <div key={v._id || v.id || v.code} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{v.code}</div>
                  <div className="text-sm text-gray-600">
                    Discount: ₱{v.discount}
                    {v.minTotal ? ` • Min: ₱${v.minTotal}` : "" }
                    {v.expiresAt ? ` • Expires: ${new Date(v.expiresAt).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {/* placeholder for future edit/delete */}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminVouchers;
