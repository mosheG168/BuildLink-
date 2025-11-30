import ContractorProfile from "../models/ContractorProfile.js";
import User from "../models/User.js";

import {
  upsertContractorProfileSchema,
  prefillContractorProfileInput,
} from "../validators/contractorProfile.js";

import {
  findContractorByLicense,
  extractRegistryFields,
  normalizeStatus,
  datesEqualLoose,
} from "../services/contractorRegistry.service.js";

import { computeAndSaveProfileEmbedding } from "../services/embedding.service.js";

function toIsoDateStringLoose(v) {
  if (!v) return null;
  const s = String(v).trim();
  const t = Date.parse(s);
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const yyyy = y.length === 2 ? `20${y}` : y;
    const pad = (x) => x.toString().padStart(2, "0");
    return `${yyyy}-${pad(mo)}-${pad(d)}`;
  }
  return null;
}

async function getOrCreateProfile(userId, seed = {}) {
  let doc = await ContractorProfile.findOne({ user: userId });
  if (!doc) {
    doc = new ContractorProfile({ ...seed, user: userId });
  }
  return doc;
}

function normalizeLicenseForRole(role, licIn) {
  if (!licIn) return undefined;

  const roleStr = String(role || "").toLowerCase();
  const isSub = roleStr.includes("sub");

  if (isSub) {
    return undefined;
  }

  const licenseNumber = licIn.licenseNumber?.toString().trim();
  const status = licIn.status?.toString().trim();
  const iso = toIsoDateStringLoose(licIn.registrationDate);
  const hasCore = !!licenseNumber && !!status && !!iso;

  if (!hasCore) return undefined;

  const out = {
    licenseNumber,
    status,
    registrationDate: new Date(`${iso}T00:00:00.000Z`),
  };

  if (licIn.authorityUrl) out.authorityUrl = licIn.authorityUrl;
  if (licIn.fileUrl) out.fileUrl = licIn.fileUrl;
  if (licIn.fileTitle) out.fileTitle = licIn.fileTitle;

  return out;
}

export const getMe = async (req, res, next) => {
  try {
    const doc = await ContractorProfile.findOne({ user: req.user._id });
    return res.json(doc || null);
  } catch (e) {
    next(e);
  }
};

export const upsertMe = async (req, res, next) => {
  try {
    const userDoc = await User.findById(req.user._id).lean();
    const prefilled = prefillContractorProfileInput(userDoc, req.body);
    const { value, error } = upsertContractorProfileSchema.validate(prefilled, {
      abortEarly: false,
      stripUnknown: true,
    });
    if (error) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.details });
    }

    const payload = { ...value };

    if (
      Array.isArray(payload.certificates) &&
      payload.certificates.length > 0
    ) {
      payload.contractorLicense = payload.certificates[0];
    }
    delete payload.certificates;

    const roleStr = (req.user?.role || "").toLowerCase();
    const isSub = roleStr.includes("sub");
    if (isSub) {
      delete payload.contractorLicense;
    } else if (payload.contractorLicense) {
      const normalized = normalizeLicenseForRole(
        roleStr,
        payload.contractorLicense
      );
      if (normalized) payload.contractorLicense = normalized;
      else delete payload.contractorLicense;
    }

    const doc = await getOrCreateProfile(req.user._id);
    doc.set(payload);
    doc.$locals = doc.$locals || {};
    doc.$locals.role = userDoc?.role || req.user?.role || null;
    await doc.save();
    return res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await ContractorProfile.findOneAndDelete({ user: req.user._id });
    return res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
};

export const verifyContractorLicense = async (req, res, next) => {
  try {
    const { licenseNumber, registrationDate, status, authorityUrl, fileUrl } =
      req.body ?? {};

    if (!licenseNumber)
      return res.status(400).json({ error: "licenseNumber is required" });
    if (!registrationDate)
      return res.status(400).json({ error: "registrationDate is required" });

    const role = req.user?.role;
    const allowedRoles = new Set(["contractor", "subcontractor", "business"]);
    if (!allowedRoles.has(role)) {
      return res.status(403).json({
        error: "User role not permitted to verify contractor license",
      });
    }

    const rec = await findContractorByLicense(licenseNumber);
    if (!rec)
      return res
        .status(404)
        .json({ error: "License not found in registry", code: "NOT_FOUND" });

    const f = extractRegistryFields(rec);

    const licOk = String(f.licenseNumber) === String(licenseNumber);
    const dateOk = datesEqualLoose(f.registrationDate, registrationDate);

    const registryStatus = (f.status ?? "").toString().trim();
    const statusAvailable = registryStatus.length > 0;
    const statusOk = statusAvailable
      ? normalizeStatus(registryStatus) === normalizeStatus(status || "")
      : true;

    const verified = licOk && dateOk && statusOk;

    const iso = toIsoDateStringLoose(registrationDate);
    const regDateToStore = iso ? new Date(`${iso}T00:00:00.000Z`) : undefined;

    const now = new Date();
    const setObj = {
      "contractorLicense.licenseNumber": String(licenseNumber),
      "contractorLicense.registrationDate": regDateToStore,
      "contractorLicense.status": status || "",
      "contractorLicense.verified": verified,
      "contractorLicense.lastCheckedAt": now,
      "contractorLicense.matches": {
        license: licOk,
        registrationDate: dateOk,
        status: statusOk,
      },
      "contractorLicense.registrySnapshot": rec,
      "contractorLicense.registryName": f.name ?? null,
      "contractorLicense.source": "data.gov.il",
      "contractorLicense.resourceId": "4eb61bd6-18cf-4e7c-9f9c-e166dfa0a2d8",
    };
    if (verified) setObj["contractorLicense.verifiedAt"] = now;
    if (authorityUrl) setObj["contractorLicense.authorityUrl"] = authorityUrl;
    if (fileUrl) setObj["contractorLicense.fileUrl"] = fileUrl;

    const doc = await ContractorProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: setObj, $setOnInsert: { user: req.user._id } },
      { new: true, upsert: true }
    );
    if (doc) {
      doc.$locals = doc.$locals || {};
      doc.$locals.role = req.user?.role || null;
      await doc.save();
    }

    return res.json({
      verified,
      statusAvailable,
      matches: { license: licOk, registrationDate: dateOk, status: statusOk },
      profileLicense: doc.contractorLicense ?? null,
    });
  } catch (e) {
    console.error("verifyContractorLicense error:", e?.message);
    next(e);
  }
};

export const deleteContractorLicense = async (req, res, next) => {
  try {
    const doc = await ContractorProfile.findOneAndUpdate(
      { user: req.user._id },
      { $unset: { contractorLicense: "" } },
      { new: true }
    );
    return res.json({
      deleted: true,
      profileLicense: doc?.contractorLicense ?? null,
    });
  } catch (e) {
    next(e);
  }
};

export const toggleOpenForWork = async (req, res, next) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    if (!role.includes("sub")) {
      return res
        .status(403)
        .json({ error: "Only subcontractors can use Open for Work" });
    }

    const { open } = req.body ?? {};
    if (typeof open !== "boolean") {
      return res.status(400).json({ error: "open must be boolean" });
    }

    const doc = await ContractorProfile.findOne({ user: req.user._id });
    if (!doc) return res.status(404).json({ error: "Profile not found" });
    // 👉 inject role for model logic (subs here)
    doc.$locals = doc.$locals || {};
    doc.$locals.role = req.user?.role || null;

    if (!open) {
      doc.openForWork = false;
      doc.openForWorkSince = null;
      await doc.save();
      return res.json({ openForWork: false, openForWorkSince: null });
    }

    const missing = [];
    if (!doc.primaryTrade) missing.push("מקצוע ראשי");
    if (!doc.profilePhotoUrl) missing.push("תמונת פרופיל");
    if (!doc.skills || doc.skills.length === 0) missing.push("כישורים");
    if (!doc.coverageAreas || doc.coverageAreas.length === 0)
      missing.push("אזורי כיסוי");
    const hasLicenseSignal =
      !!doc.subLicense?.fileUrl ||
      !!doc.contractorLicense?.fileUrl ||
      (!!doc.contractorLicense?.licenseNumber &&
        !!doc.contractorLicense?.registrationDate &&
        typeof doc.contractorLicense?.status === "string");
    if (!hasLicenseSignal) missing.push("רישיון/הסמכה");

    if (missing.length) {
      return res.status(400).json({
        error: "Profile incomplete",
        code: "PROFILE_INCOMPLETE",
        missing,
        message: "יש להשלים את השדות לפני הפעלה של 'פתוח לעבוד'.",
      });
    }

    try {
      await computeAndSaveProfileEmbedding(doc);
    } catch (err) {
      doc.openForWork = true;
      if (!doc.openForWorkSince) doc.openForWorkSince = new Date();
      await doc.save();
      return res.status(err.status || 503).json({
        error: "Embedding service unavailable",
        detail: err.message,
        openForWork: true,
        hasEmbedding: false,
      });
    }

    doc.openForWork = true;
    if (!doc.openForWorkSince) doc.openForWorkSince = new Date();
    await doc.save();

    return res.json({
      ok: true,
      openForWork: true,
      openForWorkSince: doc.openForWorkSince,
      message: "You're now open for work. Matching enabled.",
      embeddingVersion: doc.embeddingVersion ?? null,
      embeddingUpdatedAt: doc.embeddingUpdatedAt ?? null,
    });
  } catch (e) {
    next(e);
  }
};

export const setOpenForWork = async (req, res, next) => {
  try {
    const { open } = req.body ?? {};
    if (typeof open !== "boolean") {
      return res.status(400).json({ error: "open (boolean) is required" });
    }

    let profile = await ContractorProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new ContractorProfile({
        user: req.user._id,
        displayName: req.user?.name
          ? `${req.user.name.first || ""} ${req.user.name.last || ""}`.trim()
          : "User",
        primaryTrade: "",
        address: { country: "IL" },
        contact: { email: req.user?.email || "" },
      });
    }
    profile.$locals = profile.$locals || {};
    profile.$locals.role = req.user?.role || null;

    profile.openForWork = open;
    await profile.save();

    if (open) {
      const missing = [];
      const p = profile;

      if (!p.primaryTrade?.trim()) missing.push("Primary Trade");
      if (!Array.isArray(p.skills) || p.skills.length === 0)
        missing.push("Skills");
      if (!Array.isArray(p.coverageAreas) || p.coverageAreas.length === 0)
        missing.push("Coverage Areas");

      const hasLicense =
        !!p.subLicense?.fileUrl ||
        !!p.contractorLicense?.fileUrl ||
        (!!p.contractorLicense?.licenseNumber &&
          !!p.contractorLicense?.registrationDate &&
          typeof p.contractorLicense?.status === "string");
      if (!hasLicense) missing.push("License/Certification");

      if (!p.profilePhotoUrl) missing.push("Avatar");

      if (missing.length) {
        return res.status(400).json({
          error:
            "Cannot open for work until profile is complete: " +
            missing.join(", "),
          code: "INCOMPLETE_PROFILE",
          missing,
        });
      }

      try {
        await computeAndSaveProfileEmbedding(profile);
      } catch (err) {
        return res.status(err.status || 503).json({
          error: "Embedding service unavailable",
          detail: err.message,
          openForWork: profile.openForWork,
          hasEmbedding: Array.isArray(profile.profileEmbedding),
          embeddingUpdatedAt: profile.embeddingUpdatedAt || null,
        });
      }
    } else {
    }

    return res.json({
      openForWork: profile.openForWork,
      hasEmbedding: Array.isArray(profile.profileEmbedding),
      embeddingUpdatedAt: profile.embeddingUpdatedAt || null,
    });
  } catch (e) {
    next(e);
  }
};
