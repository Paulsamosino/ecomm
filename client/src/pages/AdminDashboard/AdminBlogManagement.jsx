import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar, 
  User, 
  Tag, 
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGetAllPosts, apiUpdatePostStatus, apiDeletePost, apiGetBlogStats, apiGetPostById } from "@/api/admin";
import toast from "react-hot-toast";

const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    pendingPosts: 0,
    totalViews: 0,
    totalComments: 0
  });

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Initialize data on component mount
  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPosts();
    }, 500); // 500ms delay for search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Fetch posts when filters change (but not search term since it's debounced above)
  useEffect(() => {
    fetchPosts();
  }, [statusFilter, authorFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Add filters to params
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (authorFilter !== "all") {
        params.author = authorFilter;
      }
      if (searchTerm) {
        params.q = searchTerm;
      }
      
      const response = await apiGetAllPosts(params);
      setPosts(response.data || response || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch blog posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from posts data for now since admin stats endpoint may not exist
      const allPosts = await apiGetAllPosts({});
      const postsData = allPosts.data || allPosts || [];
      
      const stats = {
        totalPosts: postsData.length,
        publishedPosts: postsData.filter(post => post.status === 'published').length,
        draftPosts: postsData.filter(post => post.status === 'draft').length,
        pendingPosts: postsData.filter(post => post.status === 'pending').length,
        totalViews: postsData.reduce((sum, post) => sum + (post.views || 0), 0),
        totalComments: postsData.reduce((sum, post) => sum + (post.commentsCount || 0), 0)
      };
      
      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Fallback to default stats
      setStats({
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        pendingPosts: 0,
        totalViews: 0,
        totalComments: 0
      });
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      await apiUpdatePostStatus(postId, newStatus);
      toast.success(`Post status updated to ${newStatus}`);
      fetchPosts();
      fetchStats(); // Refresh stats after status change
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update post status");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      await apiDeletePost(postId);
      toast.success("Post deleted successfully");
      fetchPosts();
      fetchStats(); // Refresh stats after deletion
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleViewPost = async (postId) => {
    try {
      const post = await apiGetPostById(postId);
      setSelectedPost(post);
      setViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post details");
    }
  };

  const handleEditPost = async (postId) => {
    try {
      const post = await apiGetPostById(postId);
      setSelectedPost(post);
      setEditForm({
        title: post.title || "",
        content: post.content || "",
        status: post.status || "draft",
        tags: post.tags ? post.tags.join(", ") : ""
      });
      setEditModalOpen(true);
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post for editing");
    }
  };

  const handleCreatePost = () => {
    // Navigate to blog creation page
    navigate('/blog/new');
  };

  const getStatusBadge = (status) => {
    const configs = {
      published: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircle,
        label: "Published"
      },
      draft: {
        bg: "bg-gray-100", 
        text: "text-gray-800",
        icon: FileText,
        label: "Draft"
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800", 
        icon: Clock,
        label: "Pending"
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircle,
        label: "Rejected"
      }
    };

    const config = configs[status] || configs.draft;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </div>
    );
  };

  // Fetch posts when filters change
  useEffect(() => {
    fetchPosts();
  }, [statusFilter, authorFilter, searchTerm]);

  const filteredPosts = posts; // All filtering is now done server-side

  // View Modal Component
  const ViewModal = () => {
    if (!viewModalOpen || !selectedPost) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Post Details</h2>
            <button
              onClick={() => setViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Post Content */}
              <div className="lg:col-span-2">
                {/* Cover Image */}
                {selectedPost.coverImage && (
                  <div className="mb-6">
                    <img
                      src={selectedPost.coverImage}
                      alt={selectedPost.title}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                  </div>
                )}

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedPost.title}
                </h1>
                
                {/* Tags */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedPost.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedPost.content || "No content available"}
                  </div>
                </div>
              </div>

              {/* Post Meta Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Post Information</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    {getStatusBadge(selectedPost.status)}
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Author</span>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedPost.author?.name || "Unknown Author"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedPost.authorType || "User"}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedPost.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Views</span>
                    <span className="text-sm text-gray-900">
                      {selectedPost.views || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Comments</span>
                    <span className="text-sm text-gray-900">
                      {selectedPost.commentsCount || 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Upvotes</span>
                    <span className="text-sm text-gray-900">
                      {selectedPost.upvotes || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit Modal Component
  const EditModal = () => {
    const handleSave = async () => {
      try {
        const updateData = {
          title: editForm.title,
          content: editForm.content,
          status: editForm.status,
          tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        };

        await apiUpdatePostStatus(selectedPost._id, updateData.status);
        toast.success("Post updated successfully");
        setEditModalOpen(false);
        fetchPosts();
        fetchStats();
      } catch (error) {
        console.error("Error updating post:", error);
        toast.error("Failed to update post");
      }
    };

    if (!editModalOpen || !selectedPost) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Edit Post</h2>
            <button
              onClick={() => setEditModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={editForm.title || ""}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Post title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  value={editForm.content || ""}
                  onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                  rows={12}
                  className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Post content..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editForm.status || "draft"}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.tags || ""}
                    onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                    className="w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditModalOpen(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="px-6 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-500 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600 mt-1">Manage and moderate blog content</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">{stats.publishedPosts}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draftPosts}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingPosts}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comments</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalComments.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Posts
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author Type
              </label>
              <select
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                className="w-full px-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Authors</option>
                <option value="sellers">Sellers</option>
                <option value="buyers">Buyers</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Blog Posts ({filteredPosts.length})
              </h2>
              <Button 
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleCreatePost}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          {post.content ? 
                            post.content.length > 100 ? 
                              post.content.substring(0, 100) + "..." : 
                              post.content 
                            : "No content available"
                          }
                        </p>
                        <div className="flex items-center gap-2">
                          {(post.tags || []).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-100 text-orange-700"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {post.author?.name || "Unknown Author"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {post.authorType || "User"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.views || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {post.commentsCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {post.upvotes || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleViewPost(post._id)}
                          title="View Post"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          onClick={() => handleEditPost(post._id)}
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => handleStatusChange(post._id, "published")}
                              title="Approve Post"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleStatusChange(post._id, "rejected")}
                              title="Reject Post"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeletePost(post._id)}
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ViewModal />
      <EditModal />
    </div>
  );
};

export default AdminBlogManagement;
