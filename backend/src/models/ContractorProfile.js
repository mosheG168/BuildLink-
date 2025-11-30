import mongoose from "mongoose";
const { Schema, model } = mongoose;
import sharedRoles from "../../../shared/roles.js";
const { isSubcontractor } = sharedRoles;

const stringTrim = { type: String, trim: true };
const arrOfTrimmedStrings = (required = false) => ({
  type: [String],
  required,
  default: [],
  set: (arr) =>
    Array.from(
      new Set(
        (Array.isArray(arr) ? arr : [])
          .map((s) => (typeof s === "string" ? s.trim() : s))
          .filter(Boolean)
      )
    ),
});

export const CertificateSchema = new Schema(
  {
    licenseNumber: { ...stringTrim, index: true }, // מספר קבלן
    registrationDate: { type: Date }, // תאריך רישום
    status: { ...stringTrim }, // סטטוס (exact text from registry)
    registryName: stringTrim, // שם ישות כפי שרשום בפנקס (SHEM_YESHUT)
    source: { ...stringTrim, default: "data.gov.il" },
    resourceId: {
      ...stringTrim,
      default: "4eb61bd6-18cf-4e7c-9f9c-e166dfa0a2d8", // פנקס הקבלנים
    },

    authorityUrl: stringTrim,
    fileUrl: stringTrim,
    fileTitle: stringTrim,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
    lastCheckedAt: Date,

    matches: {
      license: { type: Boolean, default: false },
      registrationDate: { type: Boolean, default: false },
      status: { type: Boolean, default: false },
    },
    registrySnapshot: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    phone: stringTrim,
    email: { ...stringTrim, lowercase: true },
    website: stringTrim,
    socials: {
      instagram: stringTrim,
      linkedin: stringTrim,
      facebook: stringTrim,
      tiktok: stringTrim,
    },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    country: { ...stringTrim, default: "IL" },
    city: stringTrim,
    street: stringTrim,
    houseNumber: stringTrim,
    zip: stringTrim,
    googleMapsUrl: stringTrim,
  },
  { _id: false }
);

const PortfolioImageSchema = new Schema(
  {
    url: { ...stringTrim, required: true },
    caption: stringTrim,
    description: stringTrim,
  },
  { _id: false }
);

const SubLicenseSchema = new Schema(
  {
    fileUrl: { type: String, trim: true, required: true },
    fileTitle: { type: String, trim: true },
    authorityUrl: { type: String, trim: true },
  },
  { _id: false }
);

const ContractorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      index: true,
      required: true,
    },
    displayName: { ...stringTrim, required: true },
    profilePhotoUrl: stringTrim,
    companyName: stringTrim,
    primaryTrade: { ...stringTrim, required: true },
    otherTrades: arrOfTrimmedStrings(false),
    skills: arrOfTrimmedStrings(false),
    jobTypes: arrOfTrimmedStrings(false),
    services: arrOfTrimmedStrings(false),
    coverageAreas: arrOfTrimmedStrings(false),
    address: { type: AddressSchema, required: true },
    contractorLicense: { type: CertificateSchema, default: undefined },
    subLicense: { type: SubLicenseSchema, default: undefined },
    portfolio: { type: [PortfolioImageSchema], default: [] },
    documents: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.from(
          new Set(
            (arr || [])
              .map(String)
              .map((s) => s.trim())
              .filter(Boolean)
          )
        ),
    },

    contact: { type: ContactSchema, required: true },
    isVerified: { type: Boolean, default: false },
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    openForWork: { type: Boolean, default: false, index: true },
    openForWorkSince: { type: Date },
    openForWorkAt: Date,
    profileEmbedding: { type: [Number], default: undefined },
    embeddingVersion: { type: Number, default: 1 },
    embeddingUpdatedAt: Date,
  },
  { timestamps: true }
);

ContractorProfileSchema.path("contractorLicense").validate({
  validator: function (v) {
    if (!v) return true; // absent is fine
    const hasNum = !!v.licenseNumber;
    const hasDate = !!v.registrationDate;
    const hasStatus = !!v.status;
    const hasAnyCore = hasNum || hasDate || hasStatus;
    if (!hasAnyCore) return true; // file-only is allowed
    return hasNum && hasDate && hasStatus; // all-or-none
  },
  message:
    "contractorLicense requires licenseNumber, registrationDate and status when any of them is provided.",
});

ContractorProfileSchema.index({
  displayName: "text",
  companyName: "text",
  primaryTrade: "text",
  skills: "text",
  services: "text",
  coverageAreas: "text",
});
ContractorProfileSchema.index({ primaryTrade: 1 });

function isSubProfile(doc) {
  if (!doc) return false;
  const role =
    doc.$locals && typeof doc.$locals.role === "string"
      ? doc.$locals.role
      : null;
  const roleStr = role ? String(role).toLowerCase() : "";

  if (roleStr) {
    if (typeof isSubcontractor === "function") {
      return isSubcontractor(roleStr);
    }
    return roleStr.includes("sub");
  }

  return !!doc.subLicense?.fileUrl;
}

function calcCompleteness(doc) {
  const isSub = isSubProfile(doc);

  const hasLicenseCore =
    !!doc.contractorLicense?.licenseNumber &&
    !!doc.contractorLicense?.registrationDate &&
    !!doc.contractorLicense?.status;

  const hasLicense = isSub ? !!doc.subLicense?.fileUrl : hasLicenseCore;

  const base = [
    !!doc.displayName,
    !!doc.primaryTrade,
    !!doc.contact?.email,
    !!doc.address?.city,
    hasLicense,
    !!doc.profilePhotoUrl,
  ];

  const subOnly = [
    (doc.skills?.length || 0) > 0,
    (doc.services?.length || 0) > 0,
    (doc.portfolio?.length || 0) > 0,
  ];

  const checks = isSub ? [...base, ...subOnly] : base;
  const filled = checks.filter(Boolean).length;
  const score =
    checks.length > 0 ? Math.round((filled / checks.length) * 100) : 0;
  return Number.isFinite(score) ? score : 0;
}

ContractorProfileSchema.pre("save", function (next) {
  if (this.contact?.email) {
    this.contact.email = this.contact.email.trim();
  }

  this.completeness = calcCompleteness(this);

  const isSub = isSubProfile(this);
  if (!isSub) {
    const licenseVerified = !!this.contractorLicense?.verified;
    this.isVerified = Boolean(licenseVerified && this.completeness === 100);
  }

  if (this.isModified("openForWork")) {
    if (this.openForWork) {
      this.openForWorkSince = this.openForWorkSince || new Date();
    } else {
      this.openForWorkSince = undefined;
    }
  }

  next();
});

ContractorProfileSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    ret.id = _doc._id.toString();
    return ret;
  },
});

export default model("ContractorProfile", ContractorProfileSchema);
