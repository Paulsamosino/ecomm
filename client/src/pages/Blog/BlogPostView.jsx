import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { getPost, listComments, addComment, votePost, deletePost } from "@/api/blog";
import { followUser, unfollowUser, checkFollowStatus } from "@/api/social";
import { useAuth } from "@/contexts/AuthContext";
import { Edit3, Trash2, ThumbsUp, ThumbsDown, UserPlus, UserMinus, MessageCircle, Share2, Calendar, Eye } from "lucide-react";

const BlogPostView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const reloadComments = async (id) => {
    const data = await listComments(id);
    setComments(data);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await getPost(slug);
        setPost(p);
        await reloadComments(p._id);
        
        // Check follow status if user is logged in and viewing someone else's post
        if (user && p.author?._id && user.id !== p.author._id) {
          try {
            const followStatus = await checkFollowStatus(p.author._id);
            setFollowing(followStatus.isFollowing);
          } catch (error) {
            console.error("Failed to check follow status:", error);
            // Don't show error to user, just default to not following
          }
        }
      } catch (e) {
        toast.error("Post not found");
        navigate("/blog");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, navigate, user]);

  const onAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment(post._id, comment.trim());
      setComment("");
      await reloadComments(post._id);
    } catch {
      toast.error("Failed to add comment (login required?)");
    }
  };

  const onVote = async (val) => {
    try {
      const res = await votePost(post._id, val);
      setPost((prev) => ({ ...prev, score: res.score, upvotes: res.upvotes, downvotes: res.downvotes }));
    } catch {
      toast.error("Failed to vote (login required?)");
    }
  };

  const toggleFollowAuthor = async () => {
    try {
      if (!post?.author?._id) return;
      if (following) {
        await unfollowUser(post.author._id);
        setFollowing(false);
      } else {
        await followUser(post.author._id);
        setFollowing(true);
      }
    } catch {
      toast.error("Failed to update follow");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      await deletePost(post._id);
      toast.success("Post deleted successfully");
      navigate("/blog");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
      document.body.removeChild(textArea);
    }
  };

  const canEditPost = user && (user.id === post?.author?._id || user.role === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Hero Section with Cover Image */}
      {post.coverImage && (
        <div className="relative h-96 w-full overflow-hidden">
          <img 
            src={post.coverImage} 
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              console.log('Failed to load cover image:', post.coverImage);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>{post.views || 0} views</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-100">
                {!post.coverImage && (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {post.title}
                  </h1>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {post.author?.name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{post.author?.name || "Anonymous"}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.readTime || "5 min read"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Follow Button - Only show if user is not the author */}
                    {user && user.id !== post?.author?._id && (
                      <button
                        onClick={toggleFollowAuthor}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-300"
                      >
                        {following ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {following ? 'Unfollow' : 'Follow'}
                      </button>
                    )}

                    {canEditPost && (
                      <div className="flex gap-2">
                        <Link
                          to={`/blog/edit/${post._id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300"
                        >
                          <Edit3 className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-6">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-orange-600 prose-strong:text-gray-900"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-orange-500" />
                  Comments ({comments.length})
                </h2>
              </div>

              {/* Add Comment */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                {user ? (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white resize-none"
                        placeholder="Write a comment..."
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={onAddComment}
                          disabled={!comment.trim()}
                          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                        >
                          Post Comment
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 mb-4">Join the conversation! Log in to share your thoughts.</p>
                    <div className="flex gap-3 justify-center">
                      <Link
                        to="/login"
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-300"
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="px-6 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors duration-300"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Comments List */}
              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {comments.map((c) => (
                    <div key={c._id} className="p-6 hover:bg-gray-50/50 transition-colors duration-200">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold">
                          {c.user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{c.user?.name || "Anonymous"}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Voting Section */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                <div className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => user ? onVote(1) : toast.error("Please log in to vote")}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        user 
                          ? "hover:bg-green-50 text-green-600 hover:text-green-700" 
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      title={user ? "Upvote this post" : "Log in to vote"}
                    >
                      <ThumbsUp className="w-6 h-6" />
                    </button>
                    <span className="text-2xl font-bold text-gray-900">{post.score || 0}</span>
                    <button
                      onClick={() => user ? onVote(-1) : toast.error("Please log in to vote")}
                      className={`p-2 rounded-full transition-colors duration-200 ${
                        user 
                          ? "hover:bg-red-50 text-red-600 hover:text-red-700" 
                          : "text-gray-400 cursor-not-allowed"
                      }`}
                      title={user ? "Downvote this post" : "Log in to vote"}
                    >
                      <ThumbsDown className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Post Stats */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="font-semibold text-gray-900 mb-4">Post Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{post.views || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments:</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published:</span>
                    <span className="font-medium">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Share Section */}
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-orange-500" />
                  Share this post
                </h3>
                <button 
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostView;