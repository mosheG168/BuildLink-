import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import AddIcon from "@mui/icons-material/Add";
import InboxIcon from "@mui/icons-material/Inbox";
import InfoIcon from "@mui/icons-material/Info";
import LogoutIcon from "@mui/icons-material/Logout";
import { useMe } from "../../hooks/useMe";
import { usePendingRequestsCount } from "../../hooks/useJobRequests";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import NotificationsBell from "../notifications/NotificationsBell";

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const toast = useToast();
  const nav = useNavigate();
  const { logout, loading } = useAuth();
  const meQ = useMe({ retry: false });
  const me = meQ.data;
  const showRequests = !!me?.isBusiness;
  const { data: pending = 0 } = usePendingRequestsCount({
    enabled: !!me && showRequests,
  });

  if ((loading && !me) || meQ.isLoading) {
    return (
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            BuildLink
          </Typography>
        </Toolbar>
      </AppBar>
    );
  }
  if (!me) return null;

  const handleLogout = () => {
    logout();
    toast.info("Logged out");
    nav("/");
    setDrawerOpen(false);
  };

  const homePath = me?.isBusiness ? "/home/contractor" : "/home";

  const navItems = [
    { label: "Home", path: homePath, icon: <HomeIcon /> },
    { label: "Profile", path: "/profile", icon: <PersonIcon /> },
    ...(showRequests
      ? [
          {
            label: "Requests",
            path: "/requests?status=all",
            icon: <InboxIcon />,
            badge: pending,
          },
        ]
      : []),

    ...(!me?.isBusiness
      ? [{ label: "My Jobs", path: "/jobs", icon: <WorkIcon /> }]
      : []),
    { label: "About", path: "/about", icon: <InfoIcon /> },
  ];

  const logoSx = {
    textDecoration: "none",
    color: "inherit",
    fontWeight: 700,
    flexGrow: 1,
    background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  };

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" component={RouterLink} to="/" sx={logoSx}>
            BuildLink
          </Typography>
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <NotificationsBell />
              {navItems.map((item) => (
                <Badge
                  key={item.path}
                  badgeContent={item.badge || 0}
                  color="secondary"
                  invisible={!item.badge}
                >
                  <Button
                    component={RouterLink}
                    to={item.path}
                    color="inherit"
                    size="small"
                    sx={{ px: 1.5 }}
                  >
                    {item.label}
                  </Button>
                </Badge>
              ))}
              <Button
                onClick={handleLogout}
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
              >
                Logout
              </Button>
            </Box>
          )}
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NotificationsBell />
              <IconButton color="inherit" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Menu
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ px: 1, py: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  nav(item.path);
                  setDrawerOpen(false);
                }}
                sx={{ borderRadius: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: "primary.light" }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="secondary">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontWeight: 500 }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <Divider sx={{ my: 2 }} />
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: "error.main" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontWeight: 500,
                  color: "error.main",
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}
