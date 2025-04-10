import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  CreditCard,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TransactionRow = ({ transaction }) => {
  const statusStyles = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <tr className="border-b last:border-0">
      <td className="py-4 px-4">
        <div className="flex items-center">
          {transaction.type === "credit_card" ? (
            <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
          ) : (
            <Wallet className="h-5 w-5 text-gray-400 mr-2" />
          )}
          #{transaction._id.slice(-6)}
        </div>
      </td>
      <td className="py-4 px-4">
        <div>
          <p className="font-medium">{transaction.customer.name}</p>
          <p className="text-sm text-gray-600">{transaction.customer.email}</p>
        </div>
      </td>
      <td className="py-4 px-4">
        {new Date(transaction.date).toLocaleDateString()}
      </td>
      <td className="py-4 px-4">${transaction.amount.toFixed(2)}</td>
      <td className="py-4 px-4">
        <span
          className={`inline-block px-2 py-1 rounded-full text-xs ${
            statusStyles[transaction.status]
          }`}
        >
          {transaction.status.charAt(0).toUpperCase() +
            transaction.status.slice(1)}
        </span>
      </td>
      <td className="py-4 px-4 text-right">
        <Button variant="ghost" size="sm" className="text-gray-600">
          <Download className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

const SellerPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [paymentStats, setPaymentStats] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    successfulPayments: 0,
    refundedAmount: 0,
  });

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch payment statistics
      const statsRes = await fetch("/api/seller/payments/stats", { headers });
      const statsData = await statsRes.json();
      setPaymentStats(statsData);

      // Fetch transactions
      const transactionsRes = await fetch("/api/seller/payments/transactions", {
        headers,
      });
      const transactionsData = await transactionsRes.json();
      setTransactions(transactionsData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/seller/payments/report", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payment-report.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payments</h1>
        <p className="text-gray-600">Manage your payments and transactions</p>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <h3 className="text-2xl font-semibold mt-1">
                ${paymentStats.totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending Payments</p>
              <h3 className="text-2xl font-semibold mt-1">
                ${paymentStats.pendingPayments.toLocaleString()}
              </h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Successful Payments</p>
              <h3 className="text-2xl font-semibold mt-1">
                {paymentStats.successfulPayments}
              </h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Refunded Amount</p>
              <h3 className="text-2xl font-semibold mt-1">
                ${paymentStats.refundedAmount.toLocaleString()}
              </h3>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <Wallet className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-semibold mb-4 md:mb-0">Transactions</h2>
          <Button
            onClick={downloadReport}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Report
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Highest Amount</option>
                <option value="amount-low">Lowest Amount</option>
              </select>
              <ArrowUpDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-4 px-4">Transaction ID</th>
                <th className="text-left py-4 px-4">Customer</th>
                <th className="text-left py-4 px-4">Date</th>
                <th className="text-left py-4 px-4">Amount</th>
                <th className="text-left py-4 px-4">Status</th>
                <th className="text-right py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <TransactionRow
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No transactions found
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter"
                : "Transactions will appear here when you receive payments"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerPayments;
