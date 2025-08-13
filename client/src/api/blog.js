import api from "./axios";

export const listPosts = (params) => api.get("/blog", { params }).then((r) => r.data);
export const getPost = (slug) => api.get(`/blog/${slug}`).then((r) => r.data);
export const getPostById = (id) => api.get(`/blog/post/${id}`).then((r) => r.data);
export const createPost = (payload) => api.post("/blog", payload).then((r) => r.data);
export const updatePost = (id, payload) => api.put(`/blog/${id}`, payload).then((r) => r.data);
export const deletePost = (id) => api.delete(`/blog/${id}`).then((r) => r.data);
export const listComments = (postId) => api.get(`/blog/${postId}/comments`).then((r) => r.data);
export const addComment = (postId, content) => api.post(`/blog/${postId}/comments`, { content }).then((r) => r.data);
export const votePost = (postId, value) => api.post(`/blog/${postId}/vote`, { value }).then((r) => r.data);
export const voteComment = (commentId, value) => api.post(`/blog/comments/${commentId}/vote`, { value }).then((r) => r.data);
export const myFeed = (params) => api.get("/blog/feed/me", { params }).then((r) => r.data);
