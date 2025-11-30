import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUnreadCount,
  listMyNotifications,
  markNotificationRead,
  markAllRead,
} from "../api/notifications";
import { QK } from "./queryKeys";

export function useUnreadNotificationsCount(options = {}) {
  return useQuery({
    queryKey: QK.notifications.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 20_000,
    retry: false,
    ...options,
  });
}

export function useNotificationsList(options = {}) {
  const { enabled = true, ...rest } = options;
  return useQuery({
    queryKey: QK.notifications.list,
    queryFn: () => listMyNotifications({ limit: 30 }),
    enabled,
    retry: false,
    ...rest,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications.unreadCount });
      qc.invalidateQueries({ queryKey: QK.notifications.list });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.notifications.unreadCount });
      qc.invalidateQueries({ queryKey: QK.notifications.list });
    },
  });
}
