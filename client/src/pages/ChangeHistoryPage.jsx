import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  History,
  Search,
  Filter,
  Calendar,
  Package,
  Heart,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Archive,
  FileText,
  Clock,
  User,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import changeLogger, { formatLogEntry } from "@/utils/changeLogger";

export default function ChangeHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showDetails, setShowDetails] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    loadLogs();
  }, [isAuthenticated]);

  const loadLogs = () => {
    const allLogs = changeLogger.getLogs();
    const formattedLogs = allLogs.map(formatLogEntry);
    setLogs(formattedLogs);
  };

  useEffect(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply entity filter
    if (entityFilter !== "all") {
      filtered = filtered.filter(log => log.entity === entityFilter);
    }

    // Apply action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Apply date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(log => new Date(log.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(log => new Date(log.timestamp) <= toDate);
    }

    // commit filtered result
    setFilteredLogs(filtered);
  }, [logs, searchTerm, entityFilter, actionFilter, dateFrom, dateTo]);

  // Pagination calculations (derived from filteredLogs)
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredLogs.length, searchTerm, entityFilter, actionFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setEntityFilter("all");
    setActionFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `record-keeping-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleDetails = (logId) => {
    setShowDetails(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);

    return {
      total: logs.length,
      inventory: logs.filter(l => l.entity === 'inventory').length,
      breeding: logs.filter(l => l.entity === 'breeding').length,
      today: logs.filter(l => new Date(l.timestamp) >= today).length,
      thisWeek: logs.filter(l => new Date(l.timestamp) >= thisWeek).length,
      recent: logs.filter(l => {
        const logTime = new Date(l.timestamp);
        const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));
        return logTime >= hourAgo;
      }).length
    };
  }, [logs]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-[#ffb761] rounded-full flex items-center justify-center">
              <History className="text-white" size={32} />
            </div>
            <CardTitle className="text-2xl">Change History</CardTitle>
            <p className="text-gray-600">Sign in to view change history</p>
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

  const getActionIcon = (action) => {
    const iconProps = { size: 16 };
    switch (action) {
      case 'add': return <Plus className="text-green-600" {...iconProps} />;
      case 'update': return <RefreshCw className="text-blue-600" {...iconProps} />;
      case 'delete': return <Trash2 className="text-red-600" {...iconProps} />;
      case 'archive': return <Archive className="text-orange-600" {...iconProps} />;
      case 'restore': return <Eye className="text-green-600" {...iconProps} />;
      case 'duplicate': return <FileText className="text-purple-600" {...iconProps} />;
      case 'create': return <Heart className="text-pink-600" {...iconProps} />;
      case 'edit': return <RefreshCw className="text-blue-600" {...iconProps} />;
      case 'import': return <Download className="text-indigo-600" {...iconProps} />;
      case 'export': return <Download className="text-indigo-600" {...iconProps} />;
      default: return <History className="text-gray-600" {...iconProps} />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'add':
      case 'create':
      case 'restore': return 'bg-green-50 border-green-200 text-green-800';
      case 'update':
      case 'edit': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'delete': return 'bg-red-50 border-red-200 text-red-800';
      case 'archive': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'duplicate':
      case 'import':
      case 'export': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getEntityIcon = (entity) => {
    const iconProps = { size: 20, className: "text-[#ffb761]" };
    return entity === 'inventory' ?
      <Package {...iconProps} /> :
      <Heart {...iconProps} />;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now - logTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return logTime.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="space-y-6">
        {/* Header Section (centered, same sizing as Inventory) */}
        <div className="mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#ffb761] to-[#ff9500] rounded-full mb-6 shadow-xl">
              <History className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#ffb761] via-[#ff9500] to-[#ff6b35] bg-clip-text text-transparent mb-4">
              Record Keeping
            </h1>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
              Track all changes to inventory and breeding records
            </p>
          </div>

          {/* Action Buttons (centered under header) */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button onClick={loadLogs} variant="outline" size="sm" className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button onClick={exportLogs} variant="outline" className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50">
              <Download size={16} />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <History className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
                  <p className="text-xs text-orange-700">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <Package className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.inventory}</p>
                  <p className="text-xs text-orange-700">Inventory</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <Heart className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.breeding}</p>
                  <p className="text-xs text-orange-700">Breeding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <Calendar className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.today}</p>
                  <p className="text-xs text-orange-700">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <Clock className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.thisWeek}</p>
                  <p className="text-xs text-orange-700">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                  <RefreshCw className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900">{stats.recent}</p>
                  <p className="text-xs text-orange-700">Last Hour</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Filter size={20} />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-orange-800 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                  <Input
                    placeholder="Search records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-orange-300 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Entity</label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="border-orange-300 focus:border-orange-500">
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="breeding">Breeding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="border-orange-300 focus:border-orange-500">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="add">Add</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="archive">Archive</SelectItem>
                    <SelectItem value="restore">Restore</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="edit">Edit</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border-orange-300 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-orange-800 mb-1">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border-orange-300 focus:border-orange-500"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <History size={20} />
                Record Log ({filteredLogs.length} entries)
              </CardTitle>
              <div className="flex items-center gap-2">
                <label className="text-sm text-orange-700">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="text-sm border border-orange-300 rounded px-2 py-1 bg-white text-orange-900"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-orange-600">
                <History size={64} className="mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No records found</h3>
                <p>Try adjusting your filters or make some changes to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-orange-400 hover:shadow-md transition-shadow border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Entity Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getEntityIcon(log.entity)}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={getActionColor(log.action)}>
                                {getActionIcon(log.action)}
                                <span className="ml-1 capitalize font-medium">{log.action}</span>
                              </Badge>
                              <Badge variant="secondary" className="capitalize bg-orange-100 text-orange-800 border-orange-300 font-medium">
                                {log.entity}
                              </Badge>
                              <span className="text-sm text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-md">
                                <Clock size={12} />
                                {formatTimeAgo(log.timestamp)}
                              </span>
                            </div>

                            <h4 className="font-semibold text-gray-900 mb-3 text-base leading-relaxed">{log.description}</h4>

                            {/* Readable Details */}
                            {log.readableDetails && (
                              <div className="bg-gradient-to-r from-orange-50 to-orange-25 rounded-lg p-4 mb-3 border border-orange-200 shadow-sm">
                                <h5 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                  <Tag size={14} />
                                  {log.readableDetails.title}
                                </h5>
                                <div className="space-y-2">
                                  {log.readableDetails.items.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 py-1">
                                      <span className="text-sm font-medium text-orange-700 min-w-0 sm:w-1/3">{item.label}:</span>
                                      <span className="text-sm font-semibold text-gray-900 break-words sm:text-right sm:flex-1">{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded-md inline-block">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Details Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDetails(log.id)}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex-shrink-0"
                        >
                          {showDetails[log.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>

                      {/* Raw JSON Details (when expanded) */}
                      {showDetails[log.id] && (
                        <div className="mt-4 pt-4 border-t border-orange-200">
                          <h5 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                            <FileText size={14} />
                            Raw Data
                          </h5>
                          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-orange-100 p-4 rounded-lg text-xs font-mono max-h-48 overflow-y-auto shadow-inner border border-gray-700">
                            <pre className="leading-relaxed">{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-orange-200">
                    <div className="flex items-center gap-4 text-sm text-orange-700">
                      <span>Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} entries</span>
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
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                          } else {
                            pages.push(1);
                            if (currentPage > 4) pages.push('...');
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
                            if (currentPage < totalPages - 3) pages.push('...');
                            if (!pages.includes(totalPages)) pages.push(totalPages);
                          }

                          return pages.map((pageNum, index) => {
                            if (pageNum === '...') {
                              return (
                                <span key={`ellipsis-${index}`} className="px-2 py-2 text-orange-400">...</span>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}