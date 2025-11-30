import mongoose from "mongoose";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  validateUser,
  registerSchema,
  loginSchema,
  changeEmailSchema,
} from "../validators/users.validation.js";
import auth from "../middleware/auth.js";
import ContractorProfile from "../models/ContractorProfile.js";

const router = Router();

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      isBusiness: user.isBusiness,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const getUserId = (req) => req.user?._id || req.user?.sub || null;

function getViewerIdFromHeaders(req) {
  let token = null;
  const hAuth = req.headers["authorization"];
  const hX = req.headers["x-auth-token"];
  if (typeof hAuth === "string" && hAuth.startsWith("Bearer ")) {
    token = hAuth.slice(7);
  } else if (typeof hAuth === "string") {
    token = hAuth;
  } else if (typeof hX === "string") {
    token = hX;
  }
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload?.sub || payload?._id || null;
  } catch {
    return null;
  }
}

const serializeUser = (u) => ({
  id: u._id,
  name: u.name,
  phone: u.phone,
  email: u.email,
  isBusiness: u.isBusiness,
  role: u.role,
  image: u.image,
  address: u.address,
});

const normalizeEmail = (e) =>
  String(e || "")
    .trim()
    .toLowerCase();

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/register",
  authLimiter,
  validateUser(registerSchema),
  async (req, res, next) => {
    try {
      const { name, phone, email, password, image, address, isBusiness } =
        req.body;

      const lowered = normalizeEmail(email);
      const exists = await User.findOne({ email: lowered });
      if (exists)
        return res.status(409).json({ error: "Email already registered" });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        phone,
        email: lowered,
        passwordHash,
        image,
        address,
        isBusiness,
      });

      const token = signToken(user);
      res.setHeader("x-auth-token", token);
      return res.status(201).json({
        message: "Registered successfully",
        user: serializeUser(user),
        token,
      });
    } catch (e) {
      if (e?.code === 11000 && e?.keyPattern?.email) {
        return res.status(409).json({ error: "Email already registered" });
      }
      next(e);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  validateUser(loginSchema),
  async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body.email);
      const { password } = req.body;

      const invalid = "Invalid email or password";
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: invalid });

      if (user.lockUntil && user.lockUntil > Date.now()) {
        const mins = Math.ceil((user.lockUntil - Date.now()) / (1000 * 60));
        return res
          .status(403)
          .json({ error: `Account locked. Try again in ${mins} minute(s)` });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 3) {
          user.lockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h lock
        }
        await user.save();

        if (user.lockUntil && user.lockUntil > Date.now()) {
          return res.status(403).json({
            error:
              "Account locked for 24 hours due to multiple failed login attempts",
          });
        }
        return res.status(400).json({ error: invalid });
      }

      if (user.failedLoginAttempts || user.lockUntil) {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      const token = signToken(user);
      res.setHeader("x-auth-token", token);
      return res.json({ token, user: serializeUser(user) });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/me", auth, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = await ContractorProfile.findOne({ user: userId }).lean();

    const base = serializeUser(user);

    const fullName =
      `${user?.name?.first || ""} ${user?.name?.last || ""}`.trim() ||
      user.email;

    const merged = {
      ...base,
      displayName: profile?.displayName || fullName,
      profilePhotoUrl:
        profile?.profilePhotoUrl ||
        (user.image && (user.image.url || user.image)) ||
        "",

      primaryTrade: profile?.primaryTrade || "",
      companyName: profile?.companyName || "",
      isVerified: !!profile?.isVerified,
    };

    res.json(merged);
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/me/email",
  auth,
  validateUser(changeEmailSchema),
  async (req, res, next) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const newEmail = normalizeEmail(req.body.email);
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }
      if (existingUser.email === newEmail) {
        const token = signToken(existingUser);
        res.setHeader("x-auth-token", token);
        return res.json({
          message: "Email unchanged",
          user: serializeUser(existingUser),
          token,
        });
      }

      const conflict = await User.findOne({
        email: newEmail,
        _id: { $ne: userId },
      });
      if (conflict) {
        return res
          .status(409)
          .json({ error: "Email already registered to another account" });
      }

      existingUser.email = newEmail;
      await existingUser.save();

      const token = signToken(existingUser);
      res.setHeader("x-auth-token", token);

      return res.json({
        message: "Account email updated",
        user: serializeUser(existingUser),
        token,
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/search", auth, async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(
      25,
      Math.max(1, parseInt(req.query.limit || "8", 10))
    );
    if (!q) return res.json([]);

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const users = await User.find({
      $or: [{ "name.first": rx }, { "name.last": rx }, { email: rx }],
    })
      .select("name email avatarUrl image isBusiness role")
      .limit(limit)
      .lean();

    const ids = users.map((u) => String(u._id));
    const profiles = ids.length
      ? await ContractorProfile.find({ user: { $in: ids } })
          .select("user displayName primaryTrade profilePhotoUrl")
          .lean()
      : [];

    const pfMap = new Map(profiles.map((p) => [String(p.user), p]));

    const out = users.map((u) => {
      const pf = pfMap.get(String(u._id));
      return {
        id: String(u._id),
        name:
          `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim() ||
          pf?.displayName ||
          u.email,
        title:
          pf?.primaryTrade || (u?.isBusiness ? "Contractor" : u?.role || ""),
        avatarUrl: pf?.profilePhotoUrl || u?.avatarUrl || u?.image || "",
      };
    });

    res.json(out);
  } catch (e) {
    next(e);
  }
});

function toPublicProfile(p) {
  if (!p) return null;
  return {
    id: String(p._id || p.id),
    user: String(p.user),
    displayName: p.displayName || "",
    profilePhotoUrl: p.profilePhotoUrl || "",

    companyName: p.companyName || "",
    companyNumber: p.companyNumber || "",
    utr: p.utr || "",
    yearsExperience: Number.isFinite(p.yearsExperience) ? p.yearsExperience : 0,

    primaryTrade: p.primaryTrade || "",
    otherTrades: Array.isArray(p.otherTrades) ? p.otherTrades : [],
    skills: Array.isArray(p.skills) ? p.skills : [],
    jobTypes: Array.isArray(p.jobTypes) ? p.jobTypes : [],
    services: Array.isArray(p.services) ? p.services : [],
    coverageAreas: Array.isArray(p.coverageAreas) ? p.coverageAreas : [],

    address: p.address || {
      country: "IL",
      city: "",
      street: "",
      houseNumber: "",
      zip: "",
      googleMapsUrl: "",
    },
    contractorLicense: p.contractorLicense
      ? {
          licenseNumber: p.contractorLicense.licenseNumber || "",
          registrationDate: p.contractorLicense.registrationDate || null,
          status: p.contractorLicense.status || "",
          authorityUrl: p.contractorLicense.authorityUrl || "",
          fileUrl: p.contractorLicense.fileUrl || "",
          fileTitle: p.contractorLicense.fileTitle || "",
          verified: !!p.contractorLicense.verified,
          verifiedAt: p.contractorLicense.verifiedAt || null,
          lastCheckedAt: p.contractorLicense.lastCheckedAt || null,
          registryName: p.contractorLicense.registryName || "",
          matches: p.contractorLicense.matches || {
            license: false,
            registrationDate: false,
            status: false,
          },
        }
      : null,

    subLicense: p.subLicense
      ? {
          fileUrl: p.subLicense.fileUrl || "",
          fileTitle: p.subLicense.fileTitle || "",
          authorityUrl: p.subLicense.authorityUrl || "",
        }
      : null,

    portfolio: Array.isArray(p.portfolio)
      ? p.portfolio.map((item) => {
          const plain =
            typeof item?.toObject === "function" ? item.toObject() : item || {};
          return {
            ...plain,
            url: plain.url || "",
            caption: plain.caption || "",
            description: plain.description || "",
          };
        })
      : [],

    documents: Array.isArray(p.documents) ? p.documents : [],
    description: p.description || "",

    contact: p.contact || {
      phone: "",
      email: "",
      website: "",
      socials: {
        instagram: "",
        linkedin: "",
        facebook: "",
        tiktok: "",
      },
    },

    ratingAvg: Number(p.ratingAvg || 0),
    ratingCount: Number(p.ratingCount || 0),
    isVerified: !!p.isVerified,
    openForWork: !!p.openForWork,
    openForWorkSince: p.openForWorkSince || null,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

router.get("/:id/public", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const viewerId = getUserId(req) || getViewerIdFromHeaders(req);

    const user = await User.findById(id)
      .select("name email role isBusiness avatarUrl image")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    const profDoc = await ContractorProfile.findOne({ user: id }).lean();
    const profile = toPublicProfile(profDoc);

    const avatarUrl =
      profile?.profilePhotoUrl || user?.avatarUrl || user?.image || "";
    const displayName =
      profile?.displayName ||
      `${user?.name?.first || ""} ${user?.name?.last || ""}`.trim() ||
      user?.email;
    const title =
      profile?.primaryTrade ||
      (user?.isBusiness ? "Contractor" : user?.role || "");

    return res.json({
      id: String(id),
      name: displayName,
      email: user?.email,
      role: user?.role,
      isBusiness: !!user?.isBusiness,
      avatarUrl,
      title,
      isMe: String(viewerId || "") === String(id),
      hasProfile: !!profile,
      profile: profile || undefined,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
