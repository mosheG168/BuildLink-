import api from "./client";

export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");

  return Number(data?.count ?? 0);
}

export async function listMyNotifications({ limit = 30 } = {}) {
  const { data } = await api.get("/notifications/my", { params: { limit } });
  return Array.isArray(data) ? data : [];
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllRead() {
  const { data } = await api.patch("/notifications/mark-all-read");
  return data;
}
