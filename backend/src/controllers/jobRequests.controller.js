import mongoose from "mongoose";
import JobRequest from "../models/JobRequest.js";
import Job from "../models/jobs.js";
import Post from "../models/Post.js";
import User from "../models/User.js";
import ContractorProfile from "../models/ContractorProfile.js";
import cosine from "../utils/similarity.js";

const getUserId = (req) => req.user?._id || req.user?.sub || null;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

async function populateRequestDoc(doc) {
  if (!doc) return doc;
  await doc.populate([
    {
      path: "post",
      select: "title location salary requirements embedding publisher",
    },
    { path: "contractor", select: "name email" },
    { path: "subcontractor", select: "name email" },
  ]);
  return doc;
}

function deriveMatchedFields(subProfile = {}, postDoc = {}) {
  const out = [];
  if (subProfile.primaryTrade)
    out.push(`primaryTrade:${subProfile.primaryTrade}`);
  const reqTokens = String(postDoc.requirements || "")
    .split(/[,\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const tag = (label, arr = []) => {
    const arrLow = (arr || []).map((s) => String(s).toLowerCase());
    const hits = reqTokens.filter((t) => arrLow.includes(t));
    if (hits.length) out.push(`${label}:${hits.slice(0, 5).join(",")}`);
  };
  tag("skills", subProfile.skills);
  tag("services", subProfile.services);
  tag("areas", subProfile.coverageAreas);
  return out.slice(0, 6);
}

export async function createJobRequest(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { postId, message = "" } = req.body || {};
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ error: "postId is required" });
    }

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.publisher) === String(userId)) {
      return res.status(400).json({ error: "You cannot request your own job" });
    }

    let matchScore = null,
      matchedFields = [];
    try {
      const sub = await ContractorProfile.findOne({ user: userId })
        .select("primaryTrade skills services coverageAreas profileEmbedding")
        .lean();
      if (
        sub?.profileEmbedding?.length &&
        post.embedding?.length &&
        sub.profileEmbedding.length === post.embedding.length
      ) {
        matchScore = cosine(sub.profileEmbedding, post.embedding);
      }
      matchedFields = deriveMatchedFields(sub || {}, post || {});
    } catch {}

    let existing = await JobRequest.findOne({
      post: post._id,
      subcontractor: userId,
    });

    if (existing) {
      if (existing.status === "pending") {
        const populated = await populateRequestDoc(existing);
        return res
          .status(200)
          .json({ ok: true, alreadyRequested: true, request: populated });
      }
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "Request already accepted" });
      }
      existing.status = "pending";
      existing.message = message;
      existing.matchScore = matchScore;
      existing.matchedFields = matchedFields;
      existing.origin = "sub";
      existing.respondedAt = null;
      await existing.save();
      const populated = await populateRequestDoc(existing);
      return res.status(200).json({
        ok: true,
        alreadyRequested: false,
        revived: true,
        request: populated,
      });
    }

    const created = await JobRequest.create({
      post: post._id,
      contractor: post.publisher,
      subcontractor: userId,
      status: "pending",
      origin: "sub",
      message,
      matchScore,
      matchedFields,
    });
    const populated = await populateRequestDoc(created);
    return res
      .status(201)
      .json({ ok: true, alreadyRequested: false, request: populated });
  } catch (e) {
    next(e);
  }
}

export async function inviteSubToPost(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { postId, subcontractorId, note = "" } = req.body || {};
    if (
      !mongoose.isValidObjectId(postId) ||
      !mongoose.isValidObjectId(subcontractorId)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid postId or subcontractorId" });
    }

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (String(post.publisher) !== String(userId)) {
      return res.status(403).json({ error: "Only the post owner can invite" });
    }

    if (String(subcontractorId) === String(userId)) {
      return res.status(400).json({ error: "Cannot invite yourself" });
    }

    let doc = await JobRequest.findOne({
      post: post._id,
      subcontractor: subcontractorId,
    });

    let matchScore = null,
      matchedFields = [];
    try {
      const sub = await ContractorProfile.findOne({ user: subcontractorId })
        .select("primaryTrade skills services coverageAreas profileEmbedding")
        .lean();
      if (
        sub?.profileEmbedding?.length &&
        post?.embedding?.length &&
        sub.profileEmbedding.length === post.embedding.length
      ) {
        matchScore = cosine(sub.profileEmbedding, post.embedding);
      }
      matchedFields = deriveMatchedFields(sub || {}, post || {});
    } catch {}

    if (doc) {
      if (doc.status === "accepted") {
        const populated = await populateRequestDoc(doc);
        return res.json({ ok: true, alreadyExists: true, request: populated });
      }
      if (doc.status === "pending") {
        const populated = await populateRequestDoc(doc);
        return res.json({ ok: true, alreadyExists: true, request: populated });
      }

      doc.status = "pending";
      doc.contractor = post.publisher;
      doc.message = String(note || "");
      doc.matchScore = matchScore;
      doc.matchedFields = matchedFields;
      doc.origin = "contractor";
      doc.respondedAt = null;
      await doc.save();
      const populated = await populateRequestDoc(doc);
      return res.json({ ok: true, revived: true, request: populated });
    }

    try {
      const created = await JobRequest.create({
        post: post._id,
        contractor: post.publisher,
        subcontractor: subcontractorId,
        status: "pending",
        origin: "contractor",
        message: String(note || ""),
        matchScore,
        matchedFields,
      });
      const populated = await populateRequestDoc(created);
      return res.status(201).json({ ok: true, request: populated });
    } catch (err) {
      if (err?.code === 11000) {
        const again = await JobRequest.findOne({
          post: post._id,
          subcontractor: subcontractorId,
        });
        const populated = await populateRequestDoc(again);
        return res.json({ ok: true, alreadyExists: true, request: populated });
      }
      throw err;
    }
  } catch (e) {
    next(e);
  }
}

export async function listJobRequests(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      contractorId,
      subcontractorId,
      postId,
      status,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query || {};

    if (contractorId && String(contractorId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (subcontractorId && String(subcontractorId) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const q = {};
    if (contractorId || (!contractorId && !subcontractorId))
      q.contractor = userId;
    if (subcontractorId) q.subcontractor = userId;
    if (status) q.status = status;
    if (postId && mongoose.isValidObjectId(postId)) q.post = postId;

    const p = Math.max(1, parseInt(page, 10));
    const l = clamp(parseInt(limit, 10) || 20, 1, 100);
    const sd = String(sortDir).toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortBy]: sd };
    const [itemsRaw] = await Promise.all([
      JobRequest.find(q)
        .sort(sort)
        .skip((p - 1) * l)
        .limit(l)
        .populate("post", "title location salary requirements")
        .populate("contractor", "name email")
        .populate("subcontractor", "name email")
        .lean(),
    ]);

    const items = (itemsRaw || []).filter((r) => r?.post);

    const matchAgg = {};
    if (q.contractor)
      matchAgg.contractor = new mongoose.Types.ObjectId(String(q.contractor));
    if (q.subcontractor)
      matchAgg.subcontractor = new mongoose.Types.ObjectId(
        String(q.subcontractor)
      );
    if (q.status) matchAgg.status = q.status;
    if (q.post) matchAgg.post = new mongoose.Types.ObjectId(String(q.post));

    const totalAgg = await JobRequest.aggregate([
      { $match: matchAgg },
      {
        $lookup: {
          from: "posts",
          localField: "post",
          foreignField: "_id",
          as: "p",
        },
      },
      { $match: { "p.0": { $exists: true } } },
      { $count: "n" },
    ]);
    const total = totalAgg[0]?.n || 0;

    res.json({
      items,
      page: p,
      total,
      pageSize: l,
      sortBy,
      sortDir: sd === 1 ? "asc" : "desc",
    });
  } catch (e) {
    next(e);
  }
}

export async function listMyJobRequests(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const mine = String(req.query.mine || "contractor").toLowerCase();
    const { postId, status } = req.query;

    const p = Math.max(1, parseInt(req.query.page || "1", 10));
    const l = clamp(parseInt(req.query.limit || "20", 10) || 20, 1, 200);
    const sortBy = String(req.query.sortBy || "createdAt");
    const sd =
      String(req.query.sortDir || "desc").toLowerCase() === "asc" ? 1 : -1;

    const q = {};
    if (mine === "subcontractor") q.subcontractor = userId;
    else q.contractor = userId;
    if (status) q.status = status;
    if (postId && mongoose.isValidObjectId(postId)) q.post = postId;

    const itemsRaw = await JobRequest.find(q)
      .sort({ [sortBy]: sd })
      .skip((p - 1) * l)
      .limit(l)
      .populate("post", "title location salary requirements")
      .populate("contractor", "name email")
      .populate("subcontractor", "name email")
      .lean();

    const items = (itemsRaw || []).filter((r) => r?.post);

    const matchAgg = {};
    if (q.contractor)
      matchAgg.contractor = new mongoose.Types.ObjectId(String(q.contractor));
    if (q.subcontractor)
      matchAgg.subcontractor = new mongoose.Types.ObjectId(
        String(q.subcontractor)
      );
    if (q.status) matchAgg.status = q.status;
    if (q.post) matchAgg.post = new mongoose.Types.ObjectId(String(q.post));

    const totalAgg = await JobRequest.aggregate([
      { $match: matchAgg },
      {
        $lookup: {
          from: "posts",
          localField: "post",
          foreignField: "_id",
          as: "p",
        },
      },
      { $match: { "p.0": { $exists: true } } },
      { $count: "n" },
    ]);

    return res.json({
      items,
      page: p,
      total: totalAgg[0]?.n || 0,
      pageSize: l,
      sortBy,
      sortDir: sd === 1 ? "asc" : "desc",
    });
  } catch (e) {
    next(e);
  }
}

export async function acceptJobRequest(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const reqDoc = await JobRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });
    const isContractor = String(reqDoc.contractor) === String(userId);
    const isSub = String(reqDoc.subcontractor) === String(userId);
    if (reqDoc.origin === "sub") {
      if (!isContractor) return res.status(403).json({ error: "Forbidden" });
    } else {
      if (!isSub) return res.status(403).json({ error: "Forbidden" });
    }
    const postDoc = await Post.findById(reqDoc.post)
      .select("startDate endDate")
      .lean();
    if (reqDoc.status !== "pending")
      return res
        .status(400)
        .json({ error: "Only pending requests can be accepted" });

    reqDoc.status = "accepted";
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    const workerRole = "subcontractor";
    const job = await Job.findOneAndUpdate(
      { post: reqDoc.post, worker: reqDoc.subcontractor },
      {
        $setOnInsert: {
          post: reqDoc.post,
          contractor: reqDoc.contractor,
          worker: reqDoc.subcontractor,
          workerRole,
          status: "accepted",
          startDate: postDoc?.startDate || null,
          endDate: postDoc?.endDate || null,
        },
      },
      { new: true, upsert: true }
    );
    try {
      await Post.updateOne(
        { _id: reqDoc.post },
        { $addToSet: { acceptedBy: reqDoc.subcontractor } }
      );
    } catch {}
    const populated = await populateRequestDoc(reqDoc);
    res.json({ ok: true, request: populated, job });
  } catch (e) {
    next(e);
  }
}

export async function denyJobRequest(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const reqDoc = await JobRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });
    const isContractor = String(reqDoc.contractor) === String(userId);
    const isSub = String(reqDoc.subcontractor) === String(userId);
    if (reqDoc.origin === "sub") {
      if (!isContractor) return res.status(403).json({ error: "Forbidden" });
    } else {
      if (!isSub && !isContractor)
        return res.status(403).json({ error: "Forbidden" });
    }
    if (reqDoc.status !== "pending")
      return res
        .status(400)
        .json({ error: "Only pending requests can be denied / cancelled" });

    if (reqDoc.origin === "contractor" && isContractor) {
      reqDoc.status = "cancelled";
    } else {
      reqDoc.status = "denied";
    }
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    const populated = await populateRequestDoc(reqDoc);
    res.json({ ok: true, request: populated });
  } catch (e) {
    next(e);
  }
}

export async function withdrawJobRequest(req, res, next) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const reqDoc = await JobRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ error: "Request not found" });
    if (String(reqDoc.subcontractor) !== String(userId))
      return res.status(403).json({ error: "Forbidden" });
    if (reqDoc.status !== "pending") {
      const populated = await populateRequestDoc(reqDoc);
      return res.json({ ok: true, request: populated });
    }

    reqDoc.status = "withdrawn";
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    const populated = await populateRequestDoc(reqDoc);
    res.json({ ok: true, request: populated });
  } catch (e) {
    next(e);
  }
}

export async function countPendingForContractor(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const rows = await JobRequest.aggregate([
      {
        $match: {
          contractor: new mongoose.Types.ObjectId(String(userId)),
          status: "pending",
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "post",
          foreignField: "_id",
          as: "p",
        },
      },
      { $match: { "p.0": { $exists: true } } },
      { $count: "n" },
    ]);

    res.json(rows[0]?.n || 0);
  } catch (e) {
    next(e);
  }
}

export async function myRequestStatusForPosts(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const raw = String(req.query.postIds || "").trim();
    if (!raw) return res.json({});

    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-fA-F]{24}$/.test(s));

    if (!ids.length) return res.json({});

    const reqs = await JobRequest.find({
      subcontractor: userId,
      post: { $in: ids },
    })
      .select("_id post status")
      .lean();

    const out = {};
    for (const r of reqs) {
      out[String(r.post)] = {
        requestId: String(r._id),
        status: r.status,
        canWithdraw: r.status === "pending",
      };
    }
    return res.json(out);
  } catch (e) {
    next(e);
  }
}
