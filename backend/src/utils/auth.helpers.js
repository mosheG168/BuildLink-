export const getUserId = (req) => req.user?._id || req.user?.sub || null;

export const isTruthyFlag = (v) =>
  ["1", "true", "yes", "on"].includes(String(v ?? "").toLowerCase());
