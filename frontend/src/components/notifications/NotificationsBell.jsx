import * as React from "react";
import { IconButton, Badge, Menu, MenuItem, ListItemText } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Link as RouterLink } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUnreadNotificationsCount,
  useNotificationsList,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../../hooks/useNotifications";
import { useToast } from "../../hooks/useToast";
import { QK } from "../../hooks/queryKeys";
import { useAuth } from "../../context/AuthContext";

export default function NotificationsBell() {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const toast = useToast();
  const qc = useQueryClient();
  const countQ = useUnreadNotificationsCount();
  const listQ = useNotificationsList(open);
  const readMut = useMarkNotificationRead();
  const markAllMut = useMarkAllNotificationsRead();
  const basePath = user?.isBusiness ? "/home/contractor" : "/home";

  const makeTarget = (n) => {
    if (!n?.postId) return null;
    const focus = n?.commentId
      ? `&focus=${encodeURIComponent(n.commentId)}`
      : "";
    return `${basePath}?open=${encodeURIComponent(n.postId)}${focus}`;
  };

  const badge = countQ.isError
    ? 0
    : Number(countQ.data?.count ?? countQ.data ?? 0);
  const items = Array.isArray(listQ.data) ? listQ.data : [];

  let menuChildren = [];
  if (listQ.isError) {
    menuChildren = [
      <MenuItem key="err" disabled>
        <ListItemText
          primary="Notifications unavailable"
          secondary="(backend endpoint not found)"
        />
      </MenuItem>,
    ];
  } else if (listQ.isLoading) {
    menuChildren = [
      <MenuItem key="loading" disabled>
        Loading…
      </MenuItem>,
    ];
  } else if (!items.length) {
    menuChildren = [
      <MenuItem key="empty" disabled>
        No notifications
      </MenuItem>,
    ];
  } else {
    menuChildren = [
      ...items.map((n) => {
        const to = makeTarget(n);
        const linkProps = to ? { component: RouterLink, to } : {};
        return (
          <MenuItem
            key={n._id || n.id}
            {...linkProps}
            onClick={() => {
              if (n?._id) readMut.mutate(n._id);
              setAnchorEl(null);
            }}
            selected={!n.isRead}
          >
            <ListItemText
              primary={n.message || "New activity"}
              secondary={n.whenLabel || ""}
            />
          </MenuItem>
        );
      }),
      <MenuItem
        key="mark-all"
        onClick={async () => {
          try {
            await markAllMut.mutateAsync();
            qc.invalidateQueries({ queryKey: QK.notifications.unreadCount });
            qc.invalidateQueries({ queryKey: QK.notifications.list });
          } catch {
            toast.error("Failed to mark all as read");
          } finally {
            setAnchorEl(null);
          }
        }}
      >
        Mark all as read
      </MenuItem>,
    ];
  }

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={badge} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 320 } }}
      >
        {menuChildren}
      </Menu>
    </>
  );
}
