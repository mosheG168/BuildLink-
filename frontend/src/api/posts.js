import api from "./client";

const asId = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  return v.id || v._id || v.sub || null;
};

export async function getPosts() {
  const { data } = await api.get("/posts", { params: { includeMyRequest: 1 } });
  return data;
}

export async function getPostById(id, { includeMyRequest = true } = {}) {
  const { data } = await api.get(`/posts/${id}`, {
    params: includeMyRequest ? { includeMyRequest: 1 } : {},
  });
  return data;
}

export async function getPostsPaged({
  page = 1,
  limit = 20,
  sortBy = "date",
  sortDir = "desc",
  publisher,
  includeMyRequest = false,
} = {}) {
  const pid = asId(publisher);
  const params = { page, limit, sortBy, sortDir };
  if (pid) params.publisher = pid;
  if (includeMyRequest) params.includeMyRequest = 1;

  const { data } = await api.get("/posts", { params });
  return data;
}

export async function getMyPosts({
  publisherId,
  limit = 5,
  sortBy = "createdAt",
  sortDir = "desc",
} = {}) {
  const pid = asId(publisherId);
  const { data } = await api.get("/posts", {
    params: { ...(pid ? { publisher: pid } : {}), limit, sortBy, sortDir },
  });
  return data;
}

export async function createPostWithEmbedding(jobData) {
  const { data } = await api.post("/posts", jobData);
  return data;
}

export async function getRecommendedPostsForMe(topK = 20) {
  const { data } = await api.get(`/posts/recommended-for-me`, {
    params: { topK },
  });
  return data;
}

export async function getRecommendedSubsForPost(postId, topK = 20) {
  const { data } = await api.get(`/posts/subs-recommended/${postId}`, {
    params: { topK },
  });
  return data;
}

export async function updatePost(id, patch) {
  const { data } = await api.patch(`/posts/${id}`, patch);
  return data;
}

export async function deletePostById(id) {
  const { data } = await api.delete(`/posts/${id}`);
  return data;
}

export default {
  getPosts,
  getPostById,
  getPostsPaged,
  getMyPosts,
  createPostWithEmbedding,
  getRecommendedPostsForMe,
  getRecommendedSubsForPost,
  updatePost,
  deletePostById,
};
