import React, { useEffect, useState } from "react";
import { apiGetAllOrders, apiProcessRefundDecision } from "@/api/admin";
import toast from "react-hot-toast";

const AdminRefunds = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      setLoading(true);
      const data = await apiGetAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleDecision = async (orderId, decision) => {
    try {
      if (decision === "approved") {
        if (!confirm("Approve refund for this order? This will restore inventory and mark the order refunded.")) return;
      } else {
        const reason = prompt("Reason for declining refund:") || "Declined by admin";
        await apiProcessRefundDecision(orderId, "declined", reason);
        toast('Refund declined');
        await fetch();
        return;
      }

      await apiProcessRefundDecision(orderId, "approved", "Approved by admin");
      toast.success("Refund approved");
      await fetch();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process decision");
    }
  };

  if (loading) return <div className="p-6">Loading refunds...</div>;

  const requests = orders.filter(o => o.refundRequested);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Refund Requests</h1>
      {requests.length === 0 && <div className="text-gray-600">No refund requests found.</div>}
      <div className="grid gap-4">
        {requests.map(order => (
          <div key={order._id} className="bg-white p-4 rounded shadow-sm border">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">Order #{order._id}</div>
                <div className="text-sm text-gray-600">Buyer: {order.buyer?.name || order.buyer?.email || '—'}</div>
                <div className="text-sm text-gray-600 mt-1">Reason: {order.refundReason || 'No reason provided'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-3 py-1 rounded bg-green-50 text-green-600 border" onClick={() => handleDecision(order._id, 'approved')}>Approve</button>
                <button className="px-3 py-1 rounded bg-red-50 text-red-600 border" onClick={() => handleDecision(order._id, 'declined')}>Decline</button>
              </div>
            </div>
            {order.refundEvidence && order.refundEvidence.length > 0 && (
              <div className="mt-3 flex gap-2">
                {order.refundEvidence.map((e, i) => (
                  <img key={i} src={e.url} alt={`evidence-${i}`} className="w-28 h-20 object-cover rounded border"/>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRefunds;
