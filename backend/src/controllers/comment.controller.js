import mongoose from "mongoose";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import ContractorProfile from "../models/ContractorProfile.js";
import Notification from "../models/Notification.js";

const getUserId = (req) => req.user?._id || req.user?.sub || null;

function parseMentionsFromContent(_text = "") {
  return [];
}

function parseSortToken(token) {
  const s = String(token ?? "date")
    .toLowerCase()
    .trim();
  let field = "createdAt";
  let dir = 1;
  if (s.includes("createdat") || s.includes("date")) field = "createdAt";
  if (s.startsWith("-")) dir = -1;
  if (s.includes(":")) {
    const part = s.split(":")[1];
    if (part === "desc" || part === "-1") dir = -1;
    if (part === "asc" || part === "1") dir = 1;
  } else if (s === "desc" || s === "-1") dir = -1;
  else if (s === "asc" || s === "1") dir = 1;
  return { field, dir };
}

async function buildPublisherDisplay(userId) {
  const u = await User.findById(userId)
    .select("name image avatarUrl isBusiness role")
    .lean();
  const pf = await ContractorProfile.findOne({ user: userId })
    .select("displayName primaryTrade profilePhotoUrl")
    .lean();

  return {
    id: String(userId),
    name:
      `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim() ||
      pf?.displayName ||
      "—",
    title: pf?.primaryTrade || (u?.isBusiness ? "Contractor" : u?.role || ""),
    avatarUrl: pf?.profilePhotoUrl || u?.avatarUrl || u?.image || "",
    hasProfile: !!pf,
  };
}

export async function createComment(req, res, next) {
  try {
    const publisher = getUserId(req);
    if (!publisher) return res.status(401).json({ error: "Unauthorized" });

    const { post: postId, parent = null } = req.body || {};
    let { content = "", mentions = [] } = req.body || {};

    // normalize/validate content
    content = String(content || "").trim();
    if (!content) return res.status(400).json({ error: "Content required" });

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await Post.findById(postId)
      .select("_id publisher title")
      .lean();
    if (!post) return res.status(404).json({ error: "Post not found" });

    const parsed = parseMentionsFromContent(content);
    const allMentionIds = [...new Set([...(mentions || []), ...parsed])].filter(
      mongoose.isValidObjectId
    );
    if (allMentionIds.length) {
      const found = await User.find({ _id: { $in: allMentionIds } })
        .select("_id")
        .lean();
      const ok = new Set(found.map((u) => String(u._id)));
      mentions = allMentionIds.filter((id) => ok.has(String(id)));
    }

    const created = await Comment.create({
      content,
      publisher,
      post: postId,
      parent: parent || null,
      mentions,
    });
    try {
      const docs = [];

      if (String(post.publisher) !== String(publisher)) {
        docs.push({
          user: post.publisher,
          type: "comment",
          postId: post._id,
          commentId: created._id,
          message: `New comment on "${post.title || "your post"}"`,
        });
      }

      if (created.parent) {
        const parent = await Comment.findById(created.parent)
          .select("publisher")
          .lean();
        if (parent && String(parent.publisher) !== String(publisher)) {
          if (String(parent.publisher) !== String(post.publisher)) {
            docs.push({
              user: parent.publisher,
              type: "comment",
              postId: post._id,
              commentId: created._id,
              message: "New reply to your comment",
            });
          }
        }
      }

      for (const uid of mentions) {
        if (String(uid) === String(publisher)) continue;
        if (String(uid) === String(post.publisher)) continue;
        docs.push({
          user: uid,
          type: "mention",
          postId: post._id,
          commentId: created._id,
          message: `You were mentioned in a comment`,
        });
      }

      if (docs.length) await Notification.insertMany(docs);
    } catch (e) {
      console.warn("Notification insert skipped:", e?.message || e);
    }

    const doc = await Comment.findById(created._id)
      .populate("publisher", "name image avatarUrl isBusiness role")
      .lean();

    const publisherDisplay = await buildPublisherDisplay(publisher);

    res.status(201).json({
      ...doc,
      publisherDisplay,
    });
  } catch (e) {
    next(e);
  }
}

export async function listComments(req, res, next) {
  try {
    const q = req._validatedQuery || req.query || {};
    const { post, page = 1, limit = 20, sort = "date" } = q;

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const { field: sortField, dir: sortDir } = parseSortToken(sort);

    const items = await Comment.find({ post, parent: null })
      .sort({ [sortField]: sortDir })
      .skip((p - 1) * l)
      .limit(l)
      .populate("publisher", "name image avatarUrl isBusiness role")
      .lean();

    const userIds = [...new Set(items.map((c) => String(c.publisher?._id)))];
    const profiles = userIds.length
      ? await ContractorProfile.find({ user: { $in: userIds } })
          .select("user displayName primaryTrade profilePhotoUrl")
          .lean()
      : [];
    const pfMap = new Map(profiles.map((pf) => [String(pf.user), pf]));

    const hydrated = items.map((c) => {
      const u = c.publisher || {};
      const pf = pfMap.get(String(u._id)) || {};
      return {
        ...c,
        publisherDisplay: {
          id: String(u._id || ""),
          name:
            `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim() ||
            pf?.displayName ||
            "—",
          title:
            pf?.primaryTrade || (u?.isBusiness ? "Contractor" : u?.role || ""),
          avatarUrl: pf?.profilePhotoUrl || u?.avatarUrl || u?.image || "",
          hasProfile: !!pf,
        },
      };
    });

    res.json(hydrated);
  } catch (e) {
    next(e);
  }
}

export async function updateComment(req, res, next) {
  try {
    const uid = getUserId(req);
    const { id } = req.params;
    const { content } = req.body || {};

    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const c = await Comment.findById(id).select("publisher post").lean();
    if (!c) return res.status(404).json({ error: "Not found" });

    const post = await Post.findById(c.post).select("publisher").lean();
    const isOwner = String(c.publisher) === String(uid);
    const isPostPublisher = post && String(post.publisher) === String(uid);
    const isAdmin = req.user?.role === "admin";

    if (!(isOwner || isPostPublisher || isAdmin))
      return res.status(403).json({ error: "Forbidden" });

    const updated = await Comment.findByIdAndUpdate(
      id,
      { content: String(content || "").trim() },
      { new: true }
    )
      .populate("publisher", "name image avatarUrl isBusiness role")
      .lean();

    const publisherDisplay = await buildPublisherDisplay(
      updated.publisher?._id
    );
    res.json({ ...updated, publisherDisplay });
  } catch (e) {
    next(e);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const uid = getUserId(req);
    const { id } = req.params;

    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const c = await Comment.findById(id).select("publisher post").lean();
    if (!c) return res.status(404).json({ error: "Not found" });

    const post = await Post.findById(c.post).select("publisher").lean();
    const isOwner = String(c.publisher) === String(uid);
    const isPostPublisher = post && String(post.publisher) === String(uid);
    const isAdmin = req.user?.role === "admin";

    if (!(isOwner || isPostPublisher || isAdmin))
      return res.status(403).json({ error: "Forbidden" });

    await Comment.deleteOne({ _id: id });
    await Comment.deleteMany({ parent: id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function getCommentById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const c = await Comment.findById(id)
      .populate("publisher", "name image avatarUrl isBusiness role")
      .lean();
    if (!c) return res.status(404).json({ error: "Not found" });

    const publisherDisplay = await buildPublisherDisplay(c.publisher?._id);
    res.json({ ...c, publisherDisplay });
  } catch (e) {
    next(e);
  }
}

export async function listReplies(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const q = req._validatedQuery || req.query || {};
    const p = Math.max(1, parseInt(q.page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 20));
    const { field: sortField, dir: sortDir } = parseSortToken(q.sort);

    const items = await Comment.find({ parent: id })
      .sort({ [sortField]: sortDir })
      .skip((p - 1) * l)
      .limit(l)
      .populate("publisher", "name image avatarUrl isBusiness role")
      .lean();

    const userIds = [...new Set(items.map((c) => String(c.publisher?._id)))];
    const profiles = userIds.length
      ? await ContractorProfile.find({ user: { $in: userIds } })
          .select("user displayName primaryTrade profilePhotoUrl")
          .lean()
      : [];
    const pfMap = new Map(profiles.map((pf) => [String(pf.user), pf]));

    const out = items.map((c) => {
      const u = c.publisher || {};
      const pf = pfMap.get(String(u._id)) || {};
      return {
        ...c,
        publisherDisplay: {
          id: String(u._id || ""),
          name:
            `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim() ||
            pf?.displayName ||
            "—",
          title:
            pf?.primaryTrade || (u?.isBusiness ? "Contractor" : u?.role || ""),
          avatarUrl: pf?.profilePhotoUrl || u?.avatarUrl || u?.image || "",
          hasProfile: !!pf,
        },
      };
    });

    res.json(out);
  } catch (e) {
    next(e);
  }
}
