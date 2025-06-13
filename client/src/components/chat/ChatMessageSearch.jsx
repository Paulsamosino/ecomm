import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Calendar,
  User,
  FileText,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { axiosInstance } from "@/contexts/axios";
import toast from "react-hot-toast";

const ChatMessageSearch = ({
  chatId,
  onResultSelect,
  onClose,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "all", // all, text, file, image
    sender: "all", // all, specific sender
    dateRange: "all", // all, today, week, month
  });
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Debounced search
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.trim().length >= 2) {
      searchTimeout.current = setTimeout(() => {
        performSearch();
      }, 300);
    } else {
      setResults([]);
      setCurrentResultIndex(-1);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [query, filters]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = {
        q: query.trim(),
        ...filters,
      };

      const response = await axiosInstance.get(`/api/chat/${chatId}/search`, {
        params,
      });
      setResults(response.data.messages || []);
      setCurrentResultIndex(response.data.messages?.length > 0 ? 0 : -1);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search messages");
      setResults([]);
      setCurrentResultIndex(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0 && currentResultIndex >= 0) {
        selectResult(results[currentResultIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCurrentResultIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCurrentResultIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose?.();
    }
  };

  const selectResult = (result) => {
    onResultSelect?.(result);
    setQuery("");
    setResults([]);
    setCurrentResultIndex(-1);
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case "file":
        return <FileText className="w-3 h-3" />;
      case "image":
        return <FileText className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const navigateResults = (direction) => {
    if (results.length === 0) return;

    if (direction === "up") {
      setCurrentResultIndex((prev) =>
        prev > 0 ? prev - 1 : results.length - 1
      );
    } else {
      setCurrentResultIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : 0
      );
    }
  };

  return (
    <div className={`bg-white border-b shadow-sm ${className}`}>
      <div className="p-4">
        {/* Search Input */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search messages..."
              className="pl-10 pr-4"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Navigation */}
          {results.length > 0 && (
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateResults("up")}
                className="h-8 w-8 p-0"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigateResults("down")}
                className="h-8 w-8 p-0"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
              <span className="text-xs text-gray-500 px-2">
                {currentResultIndex + 1} of {results.length}
              </span>
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs h-7"
          >
            {showAdvanced ? "Hide" : "Show"} Filters
          </Button>

          {Object.values(filters).some((f) => f !== "all") && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                setFilters({ type: "all", sender: "all", dateRange: "all" })
              }
              className="text-xs h-7 text-blue-600"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Select
              value={filters.type}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Message Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">Text Only</SelectItem>
                <SelectItem value="file">Files</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sender}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, sender: value }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Senders</SelectItem>
                <SelectItem value="me">My Messages</SelectItem>
                <SelectItem value="other">Other Person</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.dateRange}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto border-t">
          {results.map((message, index) => (
            <div
              key={message._id}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                index === currentResultIndex ? "bg-blue-50 border-blue-200" : ""
              }`}
              onClick={() => selectResult(message)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender?.name || "Unknown"}
                    </span>
                    {getMessageTypeIcon(message.type)}
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {highlightText(
                      message.content?.substring(0, 100) +
                        (message.content?.length > 100 ? "..." : ""),
                      query
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <div className="text-sm">No messages found</div>
          <div className="text-xs mt-1">
            Try different keywords or adjust filters
          </div>
        </div>
      )}

      {/* Search Tips */}
      {query.length < 2 && (
        <div className="p-4 text-center text-gray-500">
          <div className="text-sm">Type at least 2 characters to search</div>
          <div className="text-xs mt-1">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessageSearch;
