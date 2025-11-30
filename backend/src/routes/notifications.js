import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  getUnreadCount,
  listMyNotifications,
  markNotificationRead,
  markAllRead,
} from "../controllers/notifications.controller.js";

const router = Router();

router.get("/unread-count", auth, getUnreadCount);
router.get("/my", auth, listMyNotifications);
router.patch("/:id/read", auth, markNotificationRead);
router.patch("/mark-all-read", auth, markAllRead);

export default router;
