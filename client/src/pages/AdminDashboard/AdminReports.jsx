import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Filter,
  ChevronDown,
  MessageSquare,
  Flag,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { apiGetReports, apiUpdateReportStatus } from "@/api/admin";

const ReportCard = ({ report, onStatusChange }) => {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    investigating: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[report.status]
            }`}
          >
            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
          </span>
          <p className="mt-2 text-sm text-gray-500">
            Reported {new Date(report.createdAt).toLocaleDateString()}
          </p>
        </div>
        <select
          className="px-3 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={report.status}
          onChange={(e) => onStatusChange(report._id, e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">
            {report.type === "user" ? "User Report" : "Content Report"}
          </h3>
          <p className="mt-1 text-gray-600">{report.description}</p>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                Reported {report.type === "user" ? "User" : "Content"}
              </p>
              <p className="text-sm text-gray-600">{report.targetName}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Reported By</p>
              <p className="text-sm text-gray-600">{report.reporterName}</p>
            </div>
          </div>
        </div>

        {report.status === "resolved" && report.resolution && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Resolution</p>
            <p className="text-sm text-gray-600">{report.resolution}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await apiGetReports();
      setReports(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      await apiUpdateReportStatus(reportId, newStatus);
      toast.success("Report status updated");
      fetchReports(); // Refresh reports list
    } catch (error) {
      console.error("Error updating report status:", error);
      toast.error("Failed to update status");
    }
  };

  const filteredReports = reports
    .filter((report) => {
      const matchesSearch =
        (report.targetName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (report.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === "all" || report.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" || report.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "priority":
          return b.priority - a.priority;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const reportStats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    investigating: reports.filter((r) => r.status === "investigating").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports Management</h1>
        <p className="text-gray-600">
          Review and manage user and content reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Reports</p>
              <h3 className="text-2xl font-semibold mt-1">
                {reportStats.total}
              </h3>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <Flag className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <h3 className="text-2xl font-semibold mt-1">
                {reportStats.pending}
              </h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Investigating</p>
              <h3 className="text-2xl font-semibold mt-1">
                {reportStats.investigating}
              </h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Resolved</p>
              <h3 className="text-2xl font-semibold mt-1">
                {reportStats.resolved}
              </h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Flag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="user">User Reports</option>
                <option value="content">Content Reports</option>
              </select>
              <Filter className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="relative">
              <select
                className="appearance-none pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
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
                <option value="priority">Priority</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              onStatusChange={handleStatusChange}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No reports have been submitted yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
