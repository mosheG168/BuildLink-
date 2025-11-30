import Joi from "joi";
import { israeliPhonePattern } from "./users.validation.js";

const uri = Joi.string().uri({ scheme: ["http", "https"] });
const isoDate = Joi.date().iso();

const contact = Joi.object({
  phone: Joi.string().trim().pattern(israeliPhonePattern).required().messages({
    "string.pattern.base":
      "Phone must be a valid Israeli mobile number (e.g., 05XXXXXXXX or +9725XXXXXXXX)",
    "any.required": "Phone is required",
  }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .min(5)
    .required()
    .messages({
      "string.email": "Email must be a valid email address",
      "string.min": "Email must be at least 5 characters",
      "any.required": "Email is required",
    }),
  website: uri.allow(""),
  socials: Joi.object({
    instagram: uri.allow(""),
    linkedin: uri.allow(""),
    facebook: uri.allow(""),
    tiktok: uri.allow(""),
  }).default({}),
}).required();

const address = Joi.object({
  country: Joi.string().trim().min(2).max(256).required(),
  city: Joi.string().trim().min(2).max(256).required(),
  street: Joi.string().trim().min(2).max(256).required(),
  houseNumber: Joi.alternatives()
    .try(Joi.number().min(1).max(9999), Joi.string().pattern(/^\d{1,4}$/))
    .required(),
  zip: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d{5,7}$/))
    .required(),
  googleMapsUrl: uri.allow(""),
}).required();

const contractorLicense = Joi.object({
  licenseNumber: Joi.string()
    .trim()
    .pattern(/^\d{1,10}$/)
    .messages({
      "string.pattern.base": "licenseNumber must contain digits only",
    }),
  registrationDate: isoDate
    .less("now")
    .messages({ "date.less": "registrationDate cannot be in the future" }),
  status: Joi.string().trim().min(2).max(60),
  authorityUrl: uri.allow(""),
  fileUrl: uri.allow(""),
  fileTitle: Joi.string().trim().max(120).allow(""),
  verified: Joi.forbidden(),
  verifiedAt: Joi.forbidden(),
  lastCheckedAt: Joi.forbidden(),
  matches: Joi.forbidden(),
  registrySnapshot: Joi.forbidden(),
  registryName: Joi.forbidden(),
  source: Joi.forbidden(),
  resourceId: Joi.forbidden(),
})
  .custom((v, helpers) => {
    if (!v || typeof v !== "object") return v;
    const hasNum = !!v.licenseNumber;
    const hasDate = !!v.registrationDate;
    const hasStatus = !!v.status;
    const hasAnyCore = hasNum || hasDate || hasStatus;

    if (!hasAnyCore) {
      return v;
    }
    if (hasNum && hasDate && hasStatus) {
      return v;
    }
    return helpers.error("any.custom", {
      message:
        "When providing contractorLicense core fields, licenseNumber, registrationDate and status are all required.",
    });
  })
  .optional();

const subLicense = Joi.object({
  fileUrl: uri.required(),
  fileTitle: Joi.string().trim().max(120).allow(""),
  authorityUrl: uri.allow(""),
}).options({ abortEarly: true, stripUnknown: true });

const portfolioItem = Joi.object({
  url: uri.required(),
  caption: Joi.string().trim().max(120).allow(""),
  description: Joi.string().trim().max(5000).allow(""),
});

export const upsertContractorProfileSchema = Joi.object({
  userId: Joi.forbidden(),
  isVerified: Joi.forbidden(),
  completeness: Joi.forbidden(),
  createdAt: Joi.forbidden(),
  updatedAt: Joi.forbidden(),
  __v: Joi.forbidden(),
  openForWork: Joi.forbidden(),
  openForWorkSince: Joi.forbidden(),
  openForWorkAt: Joi.forbidden(),
  profileEmbedding: Joi.forbidden(),
  embeddingUpdatedAt: Joi.forbidden(),
  embeddingVersion: Joi.forbidden(),
  subLicense: subLicense.optional(),
  displayName: Joi.string().trim().min(2).max(80).required(),
  profilePhotoUrl: Joi.string().uri().allow("", null),
  companyName: Joi.string().trim().max(120).allow(""),
  primaryTrade: Joi.string().trim().min(2).max(60).required().messages({
    "any.required": "Primary trade is required",
    "string.empty": "Primary trade is required",
    "string.min": "Primary trade must be at least 2 characters",
    "string.max": "Primary trade must be at most 60 characters",
  }),
  otherTrades: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(10)
    .default([]),
  skills: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(30)
    .default([]),

  jobTypes: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(10)
    .default([]),
  services: Joi.array()
    .items(Joi.string().trim().min(2).max(60))
    .max(30)
    .default([]),
  coverageAreas: Joi.array()
    .items(Joi.string().trim().min(2).max(80))
    .max(30)
    .default([]),
  address: address,

  contractorLicense: contractorLicense,

  portfolio: Joi.array().items(portfolioItem).max(30).default([]),
  documents: Joi.array().items(uri).max(30).default([]),

  contact: contact,
}).options({
  abortEarly: true,
  stripUnknown: true,
  convert: true,
});

export const patchContractorProfileSchema = upsertContractorProfileSchema.fork(
  Object.keys(upsertContractorProfileSchema.describe().keys),
  (s) => s.optional()
);

export const addContractorLicenseSchema = contractorLicense;
export const addPortfolioItemSchema = portfolioItem;
export const updateContactSchema = contact;
export const updateAddressSchema = address;

export function prefillContractorProfileInput(user, payload = {}) {
  if (!user) return payload;

  const out = { ...payload };

  if (!out.displayName && user?.name?.first && user?.name?.last) {
    out.displayName = `${user.name.first} ${user.name.last}`.trim();
  }

  if (!out.profilePhotoUrl && user?.image?.url) {
    out.profilePhotoUrl = user.image.url;
  }

  out.contact = out.contact || {};
  if (!out.contact.phone && user?.phone) out.contact.phone = user.phone;
  if (!out.contact.email && user?.email) out.contact.email = user.email;

  if (!out.address) out.address = {};
  const ua = user?.address || {};
  const pa = out.address;
  out.address = {
    country: pa.country ?? ua.country ?? "IL",
    city: pa.city ?? ua.city,
    street: pa.street ?? ua.street,
    houseNumber: pa.houseNumber ?? ua.houseNumber,
    zip: pa.zip ?? ua.zip,
    googleMapsUrl: pa.googleMapsUrl,
  };

  return out;
}
