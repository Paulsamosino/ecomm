import React, { useEffect, useState } from "react";
import { myFeed } from "@/api/blog";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Clock, ArrowUp, ArrowDown, MessageCircle, Calendar, Heart, Star } from "lucide-react";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await myFeed({ sort });
        setPosts(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [sort]);

  const getSortIcon = (sortType) => {
    switch(sortType) {
      case "top": return <TrendingUp className="w-4 h-4" />;
      case "trending": return <TrendingUp className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                Your Personal Feed
              </h1>
              <p className="text-gray-600">Posts from people and topics you follow</p>
            </div>
          </div>
          <div className="relative">
            <select 
              className="appearance-none bg-white/80 border border-gray-200 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 cursor-pointer" 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="top">Top Rated</option>
              <option value="trending">Trending</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {getSortIcon(sort)}
            </div>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-orange-300 animate-spin animate-reverse"></div>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-12 shadow-xl border border-white/20 text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-orange-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-4">Your feed is empty</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start following users and topics that interest you to see their posts here.
          </p>
          <Link 
            to="/blog/explore" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transform hover:scale-105 transition-all duration-300"
          >
            <Star className="w-5 h-5" />
            Explore Posts
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((p) => (
            <Link 
              key={p._id} 
              to={`/blog/${p.slug}`} 
              className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl border border-white/20 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:bg-white/90"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Author Avatar Placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {p.author?.name?.charAt(0) || 'U'}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Author and Date */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-800">{p.author?.name || 'Anonymous'}</span>
                      <span className="text-gray-400">•</span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Post Title */}
                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300 line-clamp-2">
                      {p.title}
                    </h3>

                    {/* Engagement Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <ArrowUp className="w-4 h-4" />
                        <span className="font-medium">{p.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-500">
                        <ArrowDown className="w-4 h-4" />
                        <span className="font-medium">{p.downvotes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600">
                        <MessageCircle className="w-4 h-4" />
                        <span className="font-medium">{p.commentsCount || 0} comments</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <Star className="w-4 h-4" />
                        <span className="font-medium">Score: {p.score}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-4">
                        {p.tags.slice(0, 3).map((t) => (
                          <span 
                            key={t} 
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-200"
                          >
                            #{t}
                          </span>
                        ))}
                        {p.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{p.tags.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
