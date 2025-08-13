import React, { useEffect, useState } from "react";
import { listPosts } from "@/api/blog";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, User } from "lucide-react";
import { Search, Tag, TrendingUp, Clock, ArrowUp, ArrowDown, MessageCircle, Eye, Calendar } from "lucide-react";

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await listPosts({ q, tag, sort, status: "published", page: 1, limit: 12 });
      setPosts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, tag, sort]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-4xl font-extrabold mb-8 text-orange-700 drop-shadow-lg">Explore Blog</h1>
      <div className="flex gap-3 mb-8">
        <input className="border-2 border-orange-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-orange-400" placeholder="Search posts..." value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="border-2 border-yellow-300 rounded-lg px-4 py-2 w-48 focus:ring-2 focus:ring-yellow-400" placeholder="Tag (e.g. tips)" value={tag} onChange={(e) => setTag(e.target.value)} />
        <select className="border-2 border-orange-200 rounded-lg px-4 py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="top">Top</option>
          <option value="trending">Trending</option>
        </select>
      </div>
      {loading ? (
        <p className="text-lg text-orange-500 animate-pulse">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">No posts found</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link 
              key={p._id} 
              to={`/blog/${p.slug}`} 
              className="group block bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-white/90"
            >
              {p.coverImage && (
                <div className="relative overflow-hidden">
                  <img 
                    src={p.coverImage} 
                    alt="" 
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2">
                  {p.title}
                </h3>
                {/* Meta Information */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {p.views || 0}
                  </div>
                </div>
                {/* Engagement Stats */}
                <div className="flex items-center gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowUp className="w-4 h-4" />
                    {p.upvotes}
                  </div>
                  <div className="flex items-center gap-1 text-red-500">
                    <ArrowDown className="w-4 h-4" />
                    {p.downvotes}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                    {p.commentsCount} comments
                  </div>
                </div>
                {/* Tags */}
                <div className="flex gap-2 flex-wrap">
                  {(p.tags || []).slice(0, 3).map((t) => (
                    <span 
                      key={t} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-200 hover:from-orange-200 hover:to-orange-300 transition-all duration-300"
                    >
                      #{t}
                    </span>
                  ))}
                  {(p.tags || []).length > 3 && (
                    <span className="text-xs text-gray-400">+{(p.tags || []).length - 3} more</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogList;
