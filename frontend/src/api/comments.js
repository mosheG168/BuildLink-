import api from "./client";

export async function listComments({
  postId,
  page = 1,
  limit = 50,
  sort = "date",
}) {
  const { data } = await api.get("/comments", {
    params: { post: postId, page, limit, sort },
  });
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
}

export async function createComment({
  postId,
  content,
  mentions = [],
  parent,
}) {
  const body = { content, post: postId, mentions };
  if (parent) body.parent = parent;
  const { data } = await api.post("/comments", body);
  return data;
}

export async function updateComment(id, { content, mentions }) {
  const patch = {};
  if (typeof content === "string") patch.content = content;
  if (Array.isArray(mentions)) patch.mentions = mentions;
  const { data } = await api.patch(`/comments/${id}`, patch);
  return data;
}

export async function deleteComment(id) {
  const { data } = await api.delete(`/comments/${id}`);
  return data;
}

export async function getCommentById(id) {
  const { data } = await api.get(`/comments/${id}`);
  return data;
}

export async function listReplies(
  parentId,
  { page = 1, limit = 50, sort = "date:asc" } = {}
) {
  const { data } = await api.get(`/comments/${parentId}/replies`, {
    params: { page, limit, sort },
  });
  return Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
}

export const getCommentsByPost = (postId) => listComments({ postId });
