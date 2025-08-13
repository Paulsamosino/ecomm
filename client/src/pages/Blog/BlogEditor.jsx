import React, { useState, useEffect } from "react";
import { createPost, updatePost, getPostById } from "@/api/blog";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { PenTool, Image, Tag, Save, Eye, Clock, FileText, Upload, X } from "lucide-react";

const BlogEditor = () => {
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("published");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  // Load existing post data when editing
  useEffect(() => {
    if (isEditing && id) {
      setLoading(true);
      getPostById(id)
        .then((response) => {
          const post = response.data || response;
          setPostData(post);
          setTitle(post.title || "");
          setCoverImage(post.coverImage || "");
          setContent(post.content || "");
          setTags(post.tags ? post.tags.join(", ") : "");
          setStatus(post.status || "published");
        })
        .catch((error) => {
          console.error("Failed to load post:", error);
          toast.error("Failed to load post for editing");
          navigate("/blog");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, isEditing, navigate]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Clear URL input when file is uploaded
    setCoverImage("");
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setUploadPreview("");
  };

  const uploadImageToServer = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use the blog-specific upload endpoint
      const response = await fetch('/api/upload/blog-image', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.imageUrl; // Server returns { imageUrl: 'cloudinary-url' }
    } catch (error) {
      console.error('Image upload error:', error);
      // Don't show error toast here, handle it in onSave
      return null;
    }
  };

  const onSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!content.trim()) {
      toast.error("Please write some content");
      return;
    }

    try {
      setSaving(true);
      
      let finalCoverImage = coverImage.trim();

      // If user uploaded a file, try to upload it to server
      if (uploadedFile) {
        const uploadedImageUrl = await uploadImageToServer(uploadedFile);
        if (uploadedImageUrl) {
          finalCoverImage = uploadedImageUrl;
        } else {
          // If upload failed but we have a preview URL, use that as fallback
          if (uploadPreview) {
            finalCoverImage = uploadPreview;
          } else {
            // Only show dialog if no image at all
            const continueWithoutImage = window.confirm(
              "Image upload failed and no image preview available. Would you like to save the post without a cover image?"
            );
            if (!continueWithoutImage) {
              setSaving(false);
              return;
            }
            finalCoverImage = "";
          }
        }
      }

      const payload = {
        title: title.trim(),
        coverImage: finalCoverImage,
        content: content.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status,
      };

      let response;
      if (isEditing) {
        response = await updatePost(id, payload);
        toast.success("Post updated and published!");
      } else {
        response = await createPost(payload);
        toast.success("Post published successfully!");
      }
      
      // Navigate to the post
      if (response.data?.slug) {
        navigate(`/blog/${response.data.slug}`);
      } else if (postData?.slug) {
        navigate(`/blog/${postData.slug}`);
      } else {
        navigate("/blog/feed");
      }
    } catch (e) {
      toast.error(isEditing ? "Failed to update post" : "Failed to save post");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 text-center">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post data...</p>
        </div>
      )}

      {/* Header */}
      {!loading && (
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl">
              <PenTool className="w-6 h-6 text-white" />
            </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
              {isEditing ? "Edit Post" : "Create New Post"}
            </h1>
            <p className="text-gray-600">
              {isEditing ? "Update your post content" : "Share your knowledge with the community"}
            </p>
          </div>
        </div>

        {/* Title Input */}
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 text-lg font-medium placeholder-gray-500" 
            placeholder="Enter an engaging title for your post..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>
      </div>
      )}

      {/* Main Editor */}
      {!loading && (
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="space-y-6">
          {/* Cover Image */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Image className="w-4 h-4" />
              Cover Image
            </label>
            
            {/* File Upload Option */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg">
                  <Upload className="w-4 h-4" />
                  Upload Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">or enter URL below</span>
              </div>
            </div>

            {/* Show uploaded file preview */}
            {uploadedFile && uploadPreview && (
              <div className="mb-4 relative">
                <div className="relative inline-block">
                  <img 
                    src={uploadPreview} 
                    alt="Upload preview" 
                    className="w-full max-w-md h-48 object-cover rounded-xl border border-gray-200 shadow-lg"
                  />
                  <button
                    onClick={removeUploadedFile}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">📁 {uploadedFile.name}</p>
              </div>
            )}

            {/* URL Input */}
            <input 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80" 
              placeholder="Or paste image URL here..." 
              value={coverImage} 
              onChange={(e) => setCoverImage(e.target.value)}
              disabled={!!uploadedFile}
            />
            
            {/* URL Preview */}
            {coverImage && !uploadedFile && (
              <div className="mt-3">
                <img 
                  src={coverImage} 
                  alt="Cover preview" 
                  className="w-full max-w-md h-48 object-cover rounded-xl border border-gray-200 shadow-lg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Content Editor */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <PenTool className="w-4 h-4" />
              Post Content
            </label>
            <textarea 
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80 min-h-[300px] resize-y" 
              placeholder="Write your post content here... You can use HTML tags for formatting."
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: You can use basic HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt; for formatting.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <input 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80" 
              placeholder="chickens, tips, feeding, housing (comma separated)" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
            />
            <p className="text-xs text-gray-500 mt-2">
              Add relevant tags to help others discover your post. Separate multiple tags with commas.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Publishing Options */}
      {!loading && (
      <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Eye className="w-4 h-4" />
              Status:
            </label>
            <select 
              className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 bg-white/80" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="published">Publish Now</option>
            </select>
          </div>

          <button 
            onClick={onSave}
            disabled={saving || !title.trim() || !content.trim()}
            className="group flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                {status === "published" ? <Eye className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {isEditing 
                  ? (status === "published" ? "Update & Publish" : "Update Draft")
                  : (status === "published" ? "Publish Post" : "Save Draft")
                }
              </>
            )}
          </button>
        </div>

        {status === "published" && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <p className="text-sm text-orange-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Your post will be published immediately and visible to all community members.
            </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default BlogEditor;
