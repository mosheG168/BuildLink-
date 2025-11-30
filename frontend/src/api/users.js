import api from "./client";

export async function searchUsers(q, { limit = 8, signal } = {}) {
  const query = String(q ?? "").trim();
  if (!query) return [];
  const { data } = await api.get("/users/search", {
    params: { q: query, limit: Math.max(1, Math.min(limit, 20)) },
    signal,
  });
  return Array.isArray(data) ? data : [];
}

export async function getMe({ signal } = {}) {
  const { data } = await api.get("/users/me", { signal });
  return data;
}

export async function updateAccountEmail(email) {
  const value = String(email ?? "")
    .trim()
    .toLowerCase();
  const { data } = await api.patch("/users/me/email", { email: value });
  return data;
}

export async function getPublicUser(userId, { signal } = {}) {
  if (!userId) throw new Error("userId is required");
  const { data } = await api.get(`/users/${userId}/public`, { signal });
  return data;
}
