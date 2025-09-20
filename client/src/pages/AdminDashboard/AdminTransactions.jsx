import React, { useEffect, useState } from 'react';
import { apiGetTransactions } from '@/api/admin';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ type: '', status: '', q: '' });

  useEffect(() => {
    fetch();
  }, [page, filters]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await apiGetTransactions({ page, limit, ...filters });
      setTransactions(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Transactions</h1>

      <div className="bg-white shadow rounded p-4">
        <div className="mb-4 flex gap-2">
          <select value={filters.type} onChange={(e)=>setFilters(f=>({...f,type:e.target.value}))} className="px-3 py-2 border rounded">
            <option value="">All types</option>
            <option value="fee">Fee</option>
            <option value="payout">Payout</option>
            <option value="refund">Refund</option>
            <option value="order">Order</option>
          </select>
          <select value={filters.status} onChange={(e)=>setFilters(f=>({...f,status:e.target.value}))} className="px-3 py-2 border rounded">
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <input value={filters.q} onChange={(e)=>setFilters(f=>({...f,q:e.target.value}))} placeholder="Search by id or order" className="px-3 py-2 border rounded flex-1" />
          <button onClick={()=>setPage(1)} className="px-3 py-2 bg-gray-100 rounded">Apply</button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="py-2">Date</th>
                  <th>Type</th>
                  <th>User</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="py-2">{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.type}</td>
                    <td>{t.user ? `${t.user.name || ''} (${t.user.email || ''})` : '-'}</td>
                    <td className="text-right">{t.currency} {Number(t.amount || 0).toFixed(2)}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Total: {total}</div>
              <div className="space-x-2">
                <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
                <button disabled={transactions.length<limit} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 bg-gray-100 rounded">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
