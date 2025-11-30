import mongoose from "mongoose";
import Post from "../models/Post.js";
import User from "../models/User.js";
import Job from "../models/jobs.js";
import ContractorProfile from "../models/ContractorProfile.js";

function getUserId(req) {
  return req.user?._id || req.user?.sub || null;
}

export async function acceptJob(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { postId } = req.body || {};
    if (!postId || !mongoose.isValidObjectId(postId)) {
      return res
        .status(400)
        .json({ error: "postId is required and must be a valid ObjectId" });
    }

    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (String(post.publisher) === String(userId)) {
      return res
        .status(400)
        .json({ error: "You cannot accept your own job post" });
    }

    const me = await User.findById(userId).select("role").lean();
    const workerRole = me?.role || "subcontractor";

    const job = await Job.findOneAndUpdate(
      { post: post._id, worker: userId },
      {
        $setOnInsert: {
          post: post._id,
          contractor: post.publisher,
          worker: userId,
          workerRole,
          status: "accepted",
          startDate: post.startDate || null,
          endDate: post.endDate || null,
        },
      },
      { new: true, upsert: true }
    )
      .populate(
        "post",
        "title location salary content requirements date startDate endDate"
      )
      .populate("contractor", "name email")
      .populate("worker", "name email");

    try {
      await Post.updateOne(
        { _id: post._id },
        { $addToSet: { acceptedBy: userId } }
      );
    } catch {}

    const isNew = job.createdAt.getTime() === job.updatedAt.getTime();
    return res.status(isNew ? 201 : 200).json({
      ok: true,
      alreadyAssigned: !isNew,
      job,
    });
  } catch (e) {
    next(e);
  }
}

export async function listMyJobs(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );
    const sortBy = String(req.query.sortBy || "createdAt");
    const sortDir =
      String(req.query.sortDir || "desc").toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortDir };

    const query = {
      $or: [{ worker: userId }, { contractor: userId }],
    };

    const now = new Date();
    await Job.updateMany(
      {
        status: "accepted",
        startDate: { $ne: null, $lte: now },
      },
      { $set: { status: "in_progress", updatedAt: now } }
    );
    await Job.updateMany(
      {
        status: "in_progress",
        endDate: { $ne: null, $lte: now },
      },
      { $set: { status: "completed", updatedAt: now } }
    );

    const [items, total] = await Promise.all([
      Job.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(
          "post",
          "title location salary content requirements date startDate endDate"
        )
        .populate("contractor", "name email avatarUrl image role isBusiness")
        .populate("worker", "name email avatarUrl image role isBusiness")
        .lean(),
      Job.countDocuments(query),
    ]);
    const userIds = [
      ...new Set(
        items
          .flatMap((j) => [
            j.contractor?._id?.toString(),
            j.worker?._id?.toString(),
          ])
          .filter(Boolean)
      ),
    ];
    const profiles = userIds.length
      ? await ContractorProfile.find({ user: { $in: userIds } })
          .select("user displayName primaryTrade profilePhotoUrl")
          .lean()
      : [];
    const pfMap = new Map(profiles.map((p) => [String(p.user), p]));

    const toDisplay = (userDoc) => {
      if (!userDoc) return null;
      const uid = String(userDoc._id);
      const pf = pfMap.get(uid);
      const fullName = `${userDoc?.name?.first || ""} ${
        userDoc?.name?.last || ""
      }`.trim();
      return {
        id: uid,
        name: fullName || pf?.displayName || "—",
        title:
          pf?.primaryTrade ||
          (userDoc?.isBusiness ? "Contractor" : userDoc?.role || ""),
        avatarUrl:
          pf?.profilePhotoUrl || userDoc?.avatarUrl || userDoc?.image || "",
        hasProfile: !!pf,
      };
    };
    const enriched = items.map((j) => ({
      ...j,
      contractorDisplay: toDisplay(j.contractor),
      workerDisplay: toDisplay(j.worker),
    }));
    res.json({
      items: enriched,
      page,
      total,
      pageSize: limit,
      sortBy,
      sortDir: sortDir === 1 ? "asc" : "desc",
    });
  } catch (e) {
    next(e);
  }
}

export async function updateJobStatus(req, res, next) {
  try {
    const userId = req.user?._id || req.user?.sub || null;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { status } = req.body || {};

    const allowed = new Set(["in_progress", "completed", "cancelled"]);
    if (!allowed.has(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const isContractor = String(job.contractor) === String(userId);
    if (!isContractor) {
      return res
        .status(403)
        .json({ error: "Only the contractor can update job status" });
    }

    const current = job.status;
    const transitions = {
      accepted: new Set(["in_progress", "cancelled"]),
      in_progress: new Set(["completed", "cancelled"]),
      completed: new Set([]),
      cancelled: new Set([]),
    };

    const allowedTargets = transitions[current] || new Set();
    if (!allowedTargets.has(status)) {
      return res.status(400).json({
        error: `Cannot change job status from '${current}' to '${status}'`,
      });
    }

    job.status = status;
    const now = new Date();

    if (status === "in_progress") {
      job.startDate = now;
    } else if (status === "completed") {
      job.endDate = now;
    }

    await job.save();

    if (status === "cancelled") {
      const JobRequest = (await import("../models/JobRequest.js")).default;
      await JobRequest.updateOne(
        {
          post: job.post,
          subcontractor: job.worker,
          status: { $in: ["accepted", "pending"] },
        },
        { $set: { status: "cancelled", respondedAt: now } }
      );
    }

    return res.json({ ok: true, job });
  } catch (e) {
    next(e);
  }
}
