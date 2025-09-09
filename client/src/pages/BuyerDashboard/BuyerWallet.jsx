import React, { useEffect, useState } from "react";
import { getWallet, captureTopup } from "@/api/wallet";
import { PayPalButton } from "@/components/PayPalButton";

const presetAmounts = [100, 500, 1000];

const BuyerWallet = () => {
  const [wallet, setWallet] = useState({ balance: 0, currency: "PHP", transactions: [] });
  const [topupAmount, setTopupAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  };

  const load = async () => {
    try {
      const w = await getWallet();
      setWallet(w || { balance: 0, currency: "PHP", transactions: [] });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleTopupSuccess = async (order) => {
    setLoading(true);
    try {
      const amount = Number(topupAmount) || 0;
      const orderId = order?.id || order?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      await captureTopup({ orderId, amount });
      await load();
    } catch (err) {
      console.error("Topup capture error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedTx(null);
      if (e.key === "Escape") setShowTransactionsModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const TransactionModal = ({ tx, onClose }) => {
    if (!tx) return null;
    return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200000 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-md p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg capitalize">{tx.type}</h4>
              <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div>
              <strong>Amount:</strong> {tx.amount < 0 ? "-" : "+"} ₱{Math.abs(tx.amount).toLocaleString()}
            </div>
            <div>
              <strong>Provider:</strong> {tx.meta?.provider || "—"}
            </div>
            <div>
              <strong>Order / Ref:</strong> {tx.meta?.orderId || tx.meta?.refundId || "—"}
            </div>
            <div>
              <strong>Notes:</strong> {tx.meta?.reason || tx.meta?.note || "—"}
            </div>
            <div>
              <strong>Raw meta:</strong>
              <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(tx.meta || {}, null, 2)}</pre>
            </div>
          </div>

          <div className="mt-4 text-right">
            <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const TransactionsModal = ({ transactions, onClose, onSelect }) => {
    if (!transactions) return null;
    return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 200000 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-2xl p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transactions</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="space-y-3 max-h-96 overflow-auto">
            {transactions.length === 0 && <div className="text-sm text-gray-500">No transactions yet.</div>}
            {transactions.map((tx, idx) => (
              <div
                key={tx._id || idx}
                className="flex items-center justify-between px-3 py-2 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelect(tx)}
              >
                <div>
                  <div className="font-medium">{tx.type}</div>
                  <div className="text-xs text-gray-500">{formatDate(tx.createdAt)}</div>
                </div>
                <div className={`font-semibold ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>₱{Math.abs(tx.amount).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-right">
            <button onClick={onClose} className="px-4 py-2 rounded-md border">Close</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white border border-orange-50 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-medium text-orange-700">C&P Wallet</h2>
            <div className="flex items-baseline gap-4">
              <div className="text-4xl md:text-5xl font-extrabold">₱{Number(wallet.balance || 0).toLocaleString()}</div>
              <div className="text-sm text-gray-500">Use this balance for purchases or receive refunds here.</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={load} className="px-3 py-2 rounded-md border text-sm text-gray-600 hover:bg-gray-50">Refresh</button>
            <button disabled className="px-3 py-2 rounded-md bg-white border text-sm text-gray-500">Withdraw (coming soon)</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-50 rounded-lg p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">Top Up</h3>

            <div className="flex flex-col gap-3 items-center">
              <div className="flex flex-wrap justify-center items-center gap-3">
                {presetAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setTopupAmount(amt)}
                    className={`w-24 h-10 flex items-center justify-center rounded-md border text-sm ${topupAmount === amt ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  >
                    ₱{amt}
                  </button>
                ))}

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">₱</span>
                  <input
                    type="number"
                    aria-label="Top up amount"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Number(e.target.value))}
                    className="w-28 pl-7 pr-3 h-10 border rounded-md text-right"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col items-center gap-3">
                <div className="w-full sm:w-96 md:w-80 mx-auto bg-white p-3 rounded-md border">
                  <PayPalButton
                    amount={Number(topupAmount)}
                    onSuccess={handleTopupSuccess}
                    disabled={loading || Number(topupAmount) <= 0}
                  />
                </div>

                <div className="text-xs text-gray-500">Powered by PayPal</div>
              </div>

              <p className="text-xs text-gray-400 mt-3 text-center">Top-ups are processed by PayPal. After payment completes your wallet will be credited automatically.</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-5 border">
            <h4 className="font-semibold mb-3">Quick Actions</h4>
            <div className="flex flex-col gap-3">
              <button disabled className="w-full text-left px-3 py-2 rounded-md border text-sm text-gray-500">Withdraw (coming soon)</button>
              <button onClick={load} className="w-full text-left px-3 py-2 rounded-md border text-sm hover:bg-gray-50">Refresh Balance</button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-3">Transactions</h3>
          <div className="bg-white border rounded-lg overflow-hidden p-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Your wallet transaction history is available in the Transactions modal.</p>
            <button onClick={() => setShowTransactionsModal(true)} className="px-4 py-2 rounded-md bg-orange-500 text-white">View Transactions ({wallet.transactions?.length || 0})</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedTx && <TransactionModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      {showTransactionsModal && (
        <TransactionsModal
          transactions={wallet.transactions || []}
          onClose={() => setShowTransactionsModal(false)}
          onSelect={(tx) => { setSelectedTx(tx); setShowTransactionsModal(false); }}
        />
      )}
    </div>
  );
};

export default BuyerWallet;
