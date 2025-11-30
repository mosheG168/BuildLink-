import api from "./client";

const API_BASE = "/contractor-profiles/me";

const toIsoOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function sanitizeProfilePayload(p) {
  if (!p || typeof p !== "object") return p;

  const {
    id,
    _id,
    user,
    profileEmbedding,
    embeddingVersion,
    embeddingUpdatedAt,
    openForWork,
    openForWorkSince,
    ratingAvg,
    ratingCount,
    completeness,
    isVerified,
    createdAt,
    updatedAt,
    __v,
    contractorLicense,
    ...writable
  } = p;

  if (Array.isArray(writable.certificates)) {
    writable.certificates = writable.certificates.map((c) => ({
      ...c,
      registrationDate: toIsoOrNull(c?.registrationDate),
      authorityUrl: c?.authorityUrl || undefined,
      fileUrl: c?.fileUrl || undefined,
    }));
  }

  if (writable.contractorLicense) {
    const cl = { ...writable.contractorLicense };
    delete cl.verified;
    delete cl.verifiedAt;
    delete cl.lastCheckedAt;
    delete cl.matches;
    delete cl.registrySnapshot;
    delete cl.registryName;
    delete cl.source;
    delete cl.resourceId;
    delete writable.contractorLicense;
  }

  [
    "otherTrades",
    "skills",
    "jobTypes",
    "services",
    "coverageAreas",
    "documents",
  ].forEach((k) => {
    if (Array.isArray(writable[k])) {
      writable[k] = [
        ...new Set(
          writable[k]
            .map((s) => (typeof s === "string" ? s.trim() : s))
            .filter(Boolean)
        ),
      ];
    }
  });

  if (Array.isArray(writable.portfolio)) {
    writable.portfolio = writable.portfolio.map((i) => ({
      url: i?.url || "",
      caption: typeof i?.caption === "string" ? i.caption : "",
      description:
        typeof i?.description === "string" ? i.description.trim() : "",
    }));
  }

  return writable;
}

export async function getMyContractorProfile() {
  const { data } = await api.get(API_BASE);
  return data;
}

export async function upsertMyContractorProfile(payload) {
  const writeable = sanitizeProfilePayload(payload);
  const { data } = await api.put(API_BASE, writeable);
  return data;
}

export async function deleteMyContractorProfile() {
  const { data } = await api.delete(API_BASE);
  return data;
}

export async function toggleOpenForWork(open) {
  const { data } = await api.post("/contractor-profiles/open-for-work", {
    open,
  });
  return data;
}
