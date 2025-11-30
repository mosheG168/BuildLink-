import axios from "axios";

const RESOURCE_ID = "4eb61bd6-18cf-4e7c-9f9c-e166dfa0a2d8"; // פנקס הקבלנים הרשומים
const API_BASES = [
  "https://data.gov.il/api/3/action",
  "https://data.gov.il/api/action",
];

const cache = new Map();
const TTL_MS = 1000 * 60 * 15;

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}
function setCache(key, value) {
  cache.set(key, { value, expires: Date.now() + TTL_MS });
}

export async function findContractorByLicense(licenseNumber) {
  const key = `lic:${licenseNumber}`;
  const cached = getCache(key);
  if (cached) return cached;

  const filters = encodeURIComponent(
    JSON.stringify({ MISPAR_KABLAN: String(licenseNumber) })
  );
  let lastErr;
  for (const base of API_BASES) {
    const url = `${base}/datastore_search?resource_id=${RESOURCE_ID}&limit=1&filters=${filters}`;
    try {
      const { data } = await axios.get(url, { timeout: 12_000 });
      if (data?.success && data?.result?.records?.length) {
        const rec = data.result.records[0];
        setCache(key, rec);
        return rec;
      }
      if (data?.success) return null;
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  return null;
}

export function extractRegistryFields(record = {}) {
  const keys = Object.keys(record);
  const getByRegex = (reArr) =>
    keys.find((k) => reArr.some((re) => re.test(k))) || null;

  const regDateKey =
    getByRegex([/RISHUM/i, /RISHUM/i, /REG.*DATE/i, /TA.?ARICH/i]) || null;
  const statusKey = getByRegex([/STATUS/i, /STAT/i, /ST/i, /סטטוס/i]) || null;

  return {
    licenseNumber: record.MISPAR_KABLAN ?? null,
    name: record.SHEM_YESHUT ?? record.SHEM ?? null,
    registrationDateKey: regDateKey,
    registrationDate: regDateKey ? record[regDateKey] : null,
    statusKey,
    status: statusKey ? record[statusKey] : null,
    raw: record,
  };
}

export function normalizeStatus(s = "") {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[״"׳']/g, "");
}

export function normalizeDateLoose(v) {
  if (!v) return null;
  const s = String(v).trim();

  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;

  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const yyyy = y.length === 2 ? `20${y}` : y;
    const pad = (x) => x.toString().padStart(2, "0");
    return `${yyyy}-${pad(mo)}-${pad(d)}`;
  }

  const t = Date.parse(s.replace(" ", "T"));
  if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);

  return null;
}

export function datesEqualLoose(a, b) {
  const A = normalizeDateLoose(a);
  const B = normalizeDateLoose(b);
  return A !== null && B !== null && A === B;
}
