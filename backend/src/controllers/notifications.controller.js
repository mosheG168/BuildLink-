import mongoose from "mongoose";
import Notification from "../models/Notification.js";

const getUserId = (req) => req.user?._id || req.user?.sub || null;

const toWhenLabel = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "";
  }
};

export async function getUnreadCount(req, res, next) {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const count = await Notification.countDocuments({
      user: uid,
      isRead: false,
    });
    return res.json({ count });
  } catch (e) {
    next(e);
  }
}

export async function listMyNotifications(req, res, next) {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20)
    );
    const docs = await Notification.find({ user: uid })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(limit)
      .lean();

    const items = docs.map((n) => ({
      _id: n._id,
      type: n.type,
      postId: n.postId || null,
      commentId: n.commentId || null,
      requestId: n.requestId || null,
      message: n.message || "",
      isRead: !!n.isRead,
      whenLabel: toWhenLabel(n.createdAt),
      createdAt: n.createdAt,
    }));

    return res.json(items);
  } catch (e) {
    next(e);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const uid = getUserId(req);
    const { id } = req.params;

    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const updated = await Notification.findOneAndUpdate(
      { _id: id, user: uid },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const result = await Notification.updateMany(
      { user: uid, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ ok: true, modified: result.modifiedCount || 0 });
  } catch (e) {
    next(e);
  }
}
