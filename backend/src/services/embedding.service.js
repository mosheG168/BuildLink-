import axios from "axios";

export function toTextForEmbedding(p = {}) {
  const parts = [
    p.role && `Role: ${p.role}`,
    p.displayName && `Name: ${p.displayName}`,
    p.companyName && `Company: ${p.companyName}`,
    p.primaryTrade && `Primary trade: ${p.primaryTrade}`,
    Array.isArray(p.otherTrades) &&
      p.otherTrades.length &&
      `Other trades: ${p.otherTrades.join(", ")}`,
    Array.isArray(p.skills) &&
      p.skills.length &&
      `Skills: ${p.skills.join(", ")}`,
    Array.isArray(p.services) &&
      p.services.length &&
      `Services: ${p.services.join(", ")}`,
    Array.isArray(p.jobTypes) &&
      p.jobTypes.length &&
      `Job types: ${p.jobTypes.join(", ")}`,
    Array.isArray(p.coverageAreas) &&
      p.coverageAreas.length &&
      `Coverage areas: ${p.coverageAreas.join(", ")}`,
    p.address?.city && `City: ${p.address.city}`,
    p.address?.country && `Country: ${p.address.country}`,
    p.subLicense?.fileTitle && `License/Cert: ${p.subLicense.fileTitle}`,
    !p.subLicense?.fileTitle &&
      p.contractorLicense?.fileTitle &&
      `License/Cert: ${p.contractorLicense.fileTitle}`,
    p.bio && `Bio: ${p.bio}`,
  ].filter(Boolean);
  return parts.join("\n");
}

export function toTextForPostEmbedding(p = {}) {
  const parts = [
    p.title && `Title: ${String(p.title).trim()}`,
    p.content && String(p.content).trim(),
    p.location && `Location: ${String(p.location).trim()}`,
    p.requirements && `Requirements: ${String(p.requirements).trim()}`,
    p.salary && `Salary: ${String(p.salary).trim()}`,
  ].filter(Boolean);
  return parts.join("\n");
}

const DEFAULT_URL = "http://127.0.0.1:8000/embed";

const EMBED_URL =
  process.env.PY_EMBED_URL || process.env.EMBED_URL || DEFAULT_URL;
const PROVIDER = process.env.EMBED_PROVIDER || "huggingface";
const EMBEDDING_VERSION = Number(process.env.EMBEDDING_VERSION || 1);

export async function embedTextOrThrow(text) {
  try {
    const { data } = await axios.post(
      EMBED_URL,
      { text, provider: PROVIDER },
      { timeout: 20000, headers: { "Content-Type": "application/json" } }
    );
    if (!data?.embedding || !Array.isArray(data.embedding)) {
      const m = `Embedding service returned no vector (${JSON.stringify(
        data
      ).slice(0, 200)})`;
      const e = new Error(m);
      e.status = 502;
      throw e;
    }
    return data.embedding;
  } catch (err) {
    const isConn = err?.code === "ECONNREFUSED";
    const e = new Error(
      isConn
        ? `Embedding service is unreachable at ${EMBED_URL}. Start your Python service (uvicorn) or set PY_EMBED_URL/EMBED_URL.`
        : `Embedding request failed: ${err?.message || "Unknown error"}`
    );
    e.status = isConn ? 503 : 502;
    e.cause = err;
    throw e;
  }
}

export async function computeAndSaveProfileEmbedding(profile) {
  const text = toTextForEmbedding(profile);
  const vector = await embedTextOrThrow(text);
  profile.profileEmbedding = vector;
  profile.embeddingUpdatedAt = new Date();
  profile.embeddingVersion = EMBEDDING_VERSION;
  await profile.save();
  return vector;
}

export async function computePostEmbedding(fields = {}) {
  const text = toTextForPostEmbedding(fields);
  if (!text) return [];
  try {
    return await embedTextOrThrow(text);
  } catch (e) {
    console.error("[computePostEmbedding] failed:", e?.message);
    return [];
  }
}
