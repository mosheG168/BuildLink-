import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import auth from "../middleware/auth.js";
import mime from "mime-types";
import mongoose from "mongoose";
import ContractorProfile from "../models/ContractorProfile.js";
import User from "../models/User.js";

const router = Router();

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
const SUB_LICENSE_DIR = path.join(UPLOAD_ROOT, "sub_licenses");
fs.mkdirSync(AVATAR_DIR, { recursive: true });
fs.mkdirSync(SUB_LICENSE_DIR, { recursive: true });

const publicUrl = (relative, req) => {
  const base =
    (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "") ||
    `${req.headers["x-forwarded-proto"] || req.protocol}://${req.get("host")}`;
  return `${base}${relative}`;
};

const getOwnerKeys = (Model) => {
  const candidates = ["user", "userId", "owner", "ownerId"];
  return candidates.filter((k) => !!Model?.schema?.path(k));
};

const castForKey = (Model, key, raw) => {
  const p = Model?.schema?.path(key);
  if (p?.instance === "ObjectId") {
    if (!mongoose.Types.ObjectId.isValid(raw))
      return { err: "invalid-objectid" };
    return { val: new mongoose.Types.ObjectId(raw) };
  }
  return { val: String(raw) };
};

async function getAuthUserIdOrThrow(req) {
  const fromJwt =
    req.user?.sub || req.user?._id || req.user?.id || req.user?.userId || null;

  if (fromJwt && String(fromJwt).trim()) return String(fromJwt);

  if (req.user?.email) {
    const u = await User.findOne({ email: req.user.email })
      .select("_id")
      .lean();
    if (u?._id) return String(u._id);
  }
  return null;
}

async function upsertProfileField({ Model, ownerKeys, ownerRawId, setObj }) {
  if (!ownerKeys.length) throw new Error("No owner key on ContractorProfile");

  const typed = {};
  for (const k of ownerKeys) {
    const c = castForKey(Model, k, ownerRawId);
    if (c.err) throw new Error("Invalid user id in token");
    typed[k] = c.val;
  }
  const primaryKey = ownerKeys[0];

  const r1 = await Model.updateOne(
    { [primaryKey]: typed[primaryKey] },
    { $set: setObj },
    { upsert: false }
  );
  if (r1.matchedCount > 0) return;

  const nullOrMissing = ownerKeys.flatMap((k) => [
    { [k]: null },
    { [k]: { $exists: false } },
  ]);
  const claimUpdate = {
    $set: {
      ...ownerKeys.reduce((acc, k) => ((acc[k] = typed[k]), acc), {}),
      ...setObj,
    },
  };
  const claimed = await Model.findOneAndUpdate(
    { $or: nullOrMissing },
    claimUpdate,
    { new: true }
  );
  if (claimed) return;

  const onInsert = ownerKeys.reduce((acc, k) => ((acc[k] = typed[k]), acc), {});
  await Model.updateOne(
    { [primaryKey]: typed[primaryKey] },
    { $set: setObj, $setOnInsert: onInsert },
    {
      upsert: true,
      runValidators: false,
      setDefaultsOnInsert: true,
      context: "query",
    }
  );
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".webp").toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});
const avatarAllowedMime = /^image\/(jpeg|jpg|png|webp|gif)$/i;
const avatarAllowedExt = /\.(jpe?g|png|webp|gif)$/i;

const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      !avatarAllowedMime.test(file.mimetype) ||
      !avatarAllowedExt.test(file.originalname)
    ) {
      return cb(
        new Error("Only PNG/JPG/WEBP/GIF images up to 5MB are allowed")
      );
    }
    cb(null, true);
  },
});

const subLicenseStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, SUB_LICENSE_DIR),
  filename: (_req, file, cb) => {
    const byMime = mime.extension(file.mimetype);
    const byName = path.extname(file.originalname).replace(/^\.+/, "");
    const ext = `.${(byMime || byName || "bin").toLowerCase()}`;
    cb(null, `sub_license_${uuid()}${ext}`);
  },
});
const subAllowedMime = /^(image\/(jpeg|jpg|png|webp|gif)|application\/pdf)$/i;
const subAllowedExt = /\.(jpe?g|png|webp|gif|pdf)$/i;

const uploadSubLicenseMulter = multer({
  storage: subLicenseStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      !subAllowedMime.test(file.mimetype) ||
      !subAllowedExt.test(file.originalname)
    ) {
      return cb(
        new Error("Only PDF or PNG/JPG/WEBP/GIF files up to 5MB are allowed")
      );
    }
    cb(null, true);
  },
});

router.post(
  "/me/avatar",
  auth,
  uploadAvatarMulter.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const rawId = await getAuthUserIdOrThrow(req);
      if (!rawId) return res.status(401).json({ error: "Unauthorized" });

      const ownerKeys = getOwnerKeys(ContractorProfile);
      if (!ownerKeys.length) {
        console.error("[uploads] No owner key on ContractorProfile schema");
        return res.status(500).json({ error: "Server owner mapping error" });
      }

      const relative = `/uploads/avatars/${req.file.filename}`;
      const url = publicUrl(relative, req);

      await upsertProfileField({
        Model: ContractorProfile,
        ownerKeys,
        ownerRawId: rawId,
        setObj: { profilePhotoUrl: url },
      });

      return res.json({ url });
    } catch (e) {
      const key = e?.keyPattern && Object.keys(e.keyPattern)[0];
      if (e?.code === 11000 && key && (e?.keyValue?.[key] ?? null) === null) {
        console.error(`[uploads] avatar dup null (${key}):`, e);
        return res.status(409).json({
          error: `Duplicate null ${key} documents exist in contractorprofiles. Clean them up (delete or assign) and retry.`,
        });
      }
      console.error("[uploads] avatar error:", e);
      return res.status(500).json({ error: "Failed to process upload" });
    }
  }
);

router.delete("/me/avatar", auth, async (req, res) => {
  try {
    const rawId = req.user?.sub || req.user?._id || req.user?.id;
    if (!rawId) return res.status(401).json({ error: "Unauthorized" });

    const ownerKey =
      "userId" in ContractorProfile.schema.paths
        ? "userId"
        : "user" in ContractorProfile.schema.paths
        ? "user"
        : "userId";

    const cast =
      ContractorProfile.schema.path(ownerKey)?.instance === "ObjectId"
        ? new mongoose.Types.ObjectId(String(rawId))
        : String(rawId);

    await ContractorProfile.updateOne(
      { [ownerKey]: cast },
      { $set: { profilePhotoUrl: "" } },
      { runValidators: false, context: "query" }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[uploads] delete avatar error:", e);
    return res.status(500).json({ error: "Failed to delete avatar" });
  }
});

router.post(
  "/me/sub_license",
  auth,
  uploadSubLicenseMulter.single("sub_license"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const relative = `/uploads/sub_licenses/${req.file.filename}`;
      const url = publicUrl(relative, req);
      const rawId = req.user?.sub || req.user?._id || req.user?.id;
      if (!rawId) return res.status(401).json({ error: "Unauthorized" });

      const ownerKey =
        "userId" in ContractorProfile.schema.paths
          ? "userId"
          : "user" in ContractorProfile.schema.paths
          ? "user"
          : "userId";

      const cast =
        ContractorProfile.schema.path(ownerKey)?.instance === "ObjectId"
          ? new mongoose.Types.ObjectId(String(rawId))
          : String(rawId);

      const title = (req.body?.title || "").trim();

      await ContractorProfile.updateOne(
        { [ownerKey]: cast },
        {
          $set: {
            "contractorLicense.fileUrl": url,
            ...(title ? { "contractorLicense.fileTitle": title } : {}),
          },
          $setOnInsert: { [ownerKey]: cast },
        },
        { upsert: true, runValidators: false, context: "query" }
      );

      return res.json({ url });
    } catch (e) {
      console.error("[uploads] sub_license error:", e);
      return res.status(500).json({ error: "Failed to process upload" });
    }
  }
);

router.delete("/me/sub_license", auth, async (req, res) => {
  try {
    const rawId = req.user?.sub || req.user?._id || req.user?.id;
    if (!rawId) return res.status(401).json({ error: "Unauthorized" });

    const ownerKey =
      "userId" in ContractorProfile.schema.paths
        ? "userId"
        : "user" in ContractorProfile.schema.paths
        ? "user"
        : "userId";

    const cast =
      ContractorProfile.schema.path(ownerKey)?.instance === "ObjectId"
        ? new mongoose.Types.ObjectId(String(rawId))
        : String(rawId);

    await ContractorProfile.updateOne(
      { [ownerKey]: cast },
      {
        $set: {
          "contractorLicense.fileUrl": "",
          "contractorLicense.fileTitle": "",
        },
      },
      { runValidators: false, context: "query" }
    );

    return res.json({ ok: true });
  } catch (e) {
    console.error("[uploads] delete sub_license error:", e);
    return res.status(500).json({ error: "Failed to delete sub-license" });
  }
});

router.post("/me/sub_license/title", auth, async (req, res) => {
  try {
    const rawId = await getAuthUserIdOrThrow(req);
    if (!rawId) return res.status(401).json({ error: "Unauthorized" });

    const ownerKeys = getOwnerKeys(ContractorProfile);
    if (!ownerKeys.length) {
      console.error("[uploads] No owner key on ContractorProfile schema");
      return res.status(500).json({ error: "Server owner mapping error" });
    }

    const rawTitle = (req.body?.title ?? "").toString().trim();
    const fileTitle = rawTitle ? rawTitle.slice(0, 120) : "";

    await upsertProfileField({
      Model: ContractorProfile,
      ownerKeys,
      ownerRawId: rawId,
      setObj: { "contractorLicense.fileTitle": fileTitle },
    });

    return res.json({ ok: true, title: fileTitle });
  } catch (e) {
    console.error("[uploads] sub_license title error:", e);
    return res.status(500).json({ error: "Failed to update title" });
  }
});

export default router;
