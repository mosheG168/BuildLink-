import Post from "../models/Post.js";
import User from "../models/User.js";
import ContractorProfile from "../models/ContractorProfile.js";
import cosine from "../utils/similarity.js";
import JobRequest from "../models/JobRequest.js";
import Job from "../models/jobs.js";
import { computePostEmbedding } from "../services/embedding.service.js";

function getUserId(req) {
  return req.user?._id || req.user?.sub || null;
}

function isTruthyFlag(v) {
  return ["1", "true", "yes", "on"].includes(String(v ?? "").toLowerCase());
}

async function attachMyRequestStatus(userId, items) {
  if (!userId || !Array.isArray(items) || !items.length) return items;
  const ids = items.map((p) => String(p._id || p.id)).filter(Boolean);
  const reqs = await JobRequest.find({
    subcontractor: userId,
    post: { $in: ids },
  })
    .select("_id post status")
    .lean();
  const map = new Map(reqs.map((r) => [String(r.post), r]));
  return items.map((p) => {
    const m = map.get(String(p._id || p.id));
    return {
      ...p,
      myRequest: m
        ? {
            requestId: String(m._id),
            status: m.status,
            canWithdraw: m.status === "pending",
          }
        : null,
    };
  });
}

async function mergePublisherProfiles(items) {
  const arr = Array.isArray(items) ? items : [items].filter(Boolean);
  if (!arr.length) return arr;

  const userIds = [
    ...new Set(
      arr
        .map((p) => p?.publisher?._id || p?.publisher)
        .filter(Boolean)
        .map(String)
    ),
  ];
  if (!userIds.length) return arr;

  const profiles = await ContractorProfile.find({ user: { $in: userIds } })
    .select("user displayName primaryTrade profilePhotoUrl")
    .lean();

  const pfMap = new Map(profiles.map((pf) => [String(pf.user), pf]));

  return arr.map((p) => {
    const u = p.publisher || {};
    const uid = String(u?._id || u || "");
    const pf = pfMap.get(uid);
    if (pf) {
      p.publisher = {
        ...(u || {}),
        displayName: pf.displayName ?? u.displayName,
        primaryTrade: pf.primaryTrade ?? u.primaryTrade,
        profilePhotoUrl: pf.profilePhotoUrl ?? u.profilePhotoUrl,
      };
    }
    return p;
  });
}

export async function searchPosts(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );

    if (!q) return res.json({ items: [], page, total: 0 });

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const filter = {
      $or: [
        { title: rx },
        { content: rx },
        { requirements: rx },
        { location: rx },
        { salary: rx },
      ],
    };

    let [items, total] = await Promise.all([
      Post.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(
          "publisher",
          "name image avatarUrl profilePhotoUrl displayName isBusiness role primaryTrade"
        )
        .lean(),
      Post.countDocuments(filter),
    ]);
    items = await mergePublisherProfiles(items);

    res.json({ items, page, total });
  } catch (e) {
    next(e);
  }
}

export async function searchSimilarPosts(req, res, next) {
  try {
    let { embedding, text, topK = 20, excludeMine = true } = req.body || {};
    const userId = getUserId(req);

    if ((!Array.isArray(embedding) || embedding.length === 0) && text) {
      embedding = await computePostEmbedding({ title: text, content: text });
    }

    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({
        error: "Provide either 'text' or a non-empty 'embedding' array.",
      });
    }

    const findFilter = { "embedding.0": { $exists: true } };
    if (excludeMine && userId) findFilter.publisher = { $ne: userId };

    const posts = await Post.find(findFilter)
      .select(
        "title content location salary requirements embedding publisher createdAt"
      )
      .populate(
        "publisher",
        "name image avatarUrl profilePhotoUrl displayName isBusiness role primaryTrade"
      )
      .lean();

    let scored = posts
      .map((p) => ({
        ...p,
        score: cosine(embedding, p.embedding || []),
      }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(topK) || 20)
      .map(({ embedding: _omit, ...rest }) => rest);

    scored = await attachMyRequestStatus(userId, scored);
    scored = await mergePublisherProfiles(scored);
    res.json(scored);
  } catch (e) {
    next(e);
  }
}

export async function createPost(req, res, next) {
  try {
    const {
      title,
      content,
      location,
      salary,
      requirements,
      startDate,
      endDate,
    } = req.body;

    const publisher = getUserId(req);
    if (!publisher) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findById(publisher).select("_id").lean();
    if (!user) return res.status(404).json({ error: "Publisher not found" });

    const embedding = await computePostEmbedding({
      title,
      content,
      location,
      salary,
      requirements,
    });

    const post = await Post.create({
      title,
      content,
      location,
      salary,
      requirements,
      publisher,
      embedding,
      startDate,
      endDate,
    });

    res.status(201).json(post);
  } catch (e) {
    next(e);
  }
}

export async function updatePost(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.sub || null;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.publisher) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const up = req.body || {};
    post.set(up);

    const reembedFields = [
      "title",
      "content",
      "location",
      "salary",
      "requirements",
    ];
    const shouldReembed = reembedFields.some((k) => k in up);
    if (shouldReembed) {
      const vector = await computePostEmbedding({
        title: post.title,
        content: post.content,
        location: post.location,
        salary: post.salary,
        requirements: post.requirements,
      });
      post.embedding = Array.isArray(vector) ? vector : [];
    }

    await post.save();
    res.json(post);
  } catch (e) {
    next(e);
  }
}

export async function deletePost(req, res, next) {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.publisher) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const now = new Date();

    const [reqResult, jobResult] = await Promise.all([
      JobRequest.updateMany(
        { post: id, status: { $in: ["pending", "accepted"] } },
        { $set: { status: "cancelled", respondedAt: now } }
      ),
      Job.updateMany(
        { post: id, status: { $in: ["accepted", "in_progress"] } },
        { $set: { status: "cancelled", updatedAt: now } }
      ),
    ]);

    await Post.deleteOne({ _id: id });

    res.json({
      ok: true,
      cancelledRequests: reqResult?.modifiedCount ?? 0,
      cancelledJobs: jobResult?.modifiedCount ?? 0,
    });
  } catch (e) {
    next(e);
  }
}

export async function getPost(req, res, next) {
  try {
    const userId = getUserId(req);
    const includeMyRequest = isTruthyFlag(req.query.includeMyRequest);
    let post = await Post.findById(req.params.id)
      .populate(
        "publisher",
        "name email image avatarUrl profilePhotoUrl displayName isBusiness role primaryTrade"
      )
      .lean();
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (includeMyRequest && userId) {
      const items = await attachMyRequestStatus(userId, [post]);
      post = items[0];
    }
    post = (await mergePublisherProfiles([post]))[0];

    res.json(post);
  } catch (e) {
    next(e);
  }
}

export async function listPosts(req, res, next) {
  try {
    const { publisher } = req.query;
    const includeMyRequest = isTruthyFlag(req.query.includeMyRequest);
    const userId = getUserId(req);

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "12", 10))
    );
    const sortBy = String(req.query.sortBy || "date");
    const sortDir = String(req.query.sortDir || "desc") === "asc" ? 1 : -1;

    const q = publisher ? { publisher } : {};
    const sort = { [sortBy]: sortDir };

    let [items, total] = await Promise.all([
      Post.find(q)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(
          "publisher",
          "name image avatarUrl profilePhotoUrl displayName isBusiness role primaryTrade"
        )
        .lean(),
      Post.countDocuments(q),
    ]);

    if (includeMyRequest && userId) {
      items = await attachMyRequestStatus(userId, items);
    }
    items = await mergePublisherProfiles(items);

    res.json({
      items,
      total,
      page,
      pageSize: limit,
      sortBy,
      sortDir: sortDir === 1 ? "asc" : "desc",
    });
  } catch (e) {
    next(e);
  }
}

export async function recommendedPostsForMe(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const profile = await ContractorProfile.findOne({
      user: userId,
      openForWork: true,
    })
      .select("openForWork profileEmbedding")
      .lean();

    if (!profile?.openForWork) {
      return res.status(400).json({ error: "Not open for work" });
    }
    if (
      !Array.isArray(profile.profileEmbedding) ||
      profile.profileEmbedding.length === 0
    ) {
      return res.status(400).json({
        error: "No profile embedding. Toggle Open for Work to generate one.",
      });
    }

    const posts = await Post.find({
      "embedding.0": { $exists: true },
      publisher: { $ne: userId },
    })
      .select(
        "title content location salary requirements embedding publisher date"
      )
      .populate(
        "publisher",
        "name image avatarUrl profilePhotoUrl displayName isBusiness role primaryTrade"
      )
      .lean();

    let scored = posts
      .map((p) => ({
        ...p,
        score: cosine(profile.profileEmbedding, p.embedding || []),
      }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(req.query.topK) || 20)
      .map(({ embedding, ...rest }) => rest);

    scored = await attachMyRequestStatus(userId, scored);
    scored = await mergePublisherProfiles(scored);

    res.json(scored);
  } catch (e) {
    next(e);
  }
}

export async function recommendedSubsForPost(req, res, next) {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .select("embedding title content location requirements")
      .lean();

    if (!Array.isArray(post?.embedding) || post.embedding.length === 0) {
      return res
        .status(404)
        .json({ error: "Post or post embedding not found" });
    }

    const postText = [
      post.title || "",
      post.content || "",
      post.requirements || "",
      post.location || "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const subs = await ContractorProfile.find({
      openForWork: true,
      "profileEmbedding.0": { $exists: true },
    })
      .select(
        "displayName primaryTrade skills services coverageAreas profilePhotoUrl profileEmbedding user"
      )
      .lean();

    const scored = subs
      .map((s) => {
        const base = cosine(s.profileEmbedding || [], post.embedding || []);
        const areaMatch = (s.coverageAreas || []).some((a) => {
          const aa = String(a || "").toLowerCase();
          const loc = String(post.location || "").toLowerCase();
          return aa && loc && (aa.includes(loc) || loc.includes(aa));
        })
          ? 1
          : 0;

        const trade = String(s.primaryTrade || "").toLowerCase();
        const tradeMatch = trade && postText.includes(trade) ? 1 : 0;
        const score = 0.85 * base + 0.1 * areaMatch + 0.05 * tradeMatch;
        return { ...s, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(req.query.topK) || 20);

    res.json(scored);
  } catch (e) {
    next(e);
  }
}
