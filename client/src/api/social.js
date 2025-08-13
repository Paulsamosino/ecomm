import api from "./axios";

export const followUser = (userId) => api.post(`/social/follow/user/${userId}`).then((r) => r.data);
export const unfollowUser = (userId) => api.delete(`/social/follow/user/${userId}`).then((r) => r.data);
export const checkFollowStatus = (userId) => api.get(`/social/follow/user/${userId}/status`).then((r) => r.data);
export const followTag = (tag) => api.post(`/social/follow/tag/${encodeURIComponent(tag)}`).then((r) => r.data);
export const unfollowTag = (tag) => api.delete(`/social/follow/tag/${encodeURIComponent(tag)}`).then((r) => r.data);
export const listFollowing = () => api.get("/social/following").then((r) => r.data);
export const listFollowers = () => api.get("/social/followers").then((r) => r.data);
