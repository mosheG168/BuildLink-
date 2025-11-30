import User from "../models/User.js";
import ContractorProfile from "../models/ContractorProfile.js";

export async function searchUsersSimple(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "8", 10))
    );
    if (!q) return res.json([]);

    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      $or: [{ "name.first": rx }, { "name.last": rx }, { email: rx }],
    })
      .select("_id name email avatarUrl image role isBusiness")
      .limit(limit)
      .lean();

    const ids = users.map((u) => String(u._id));
    const profiles = await ContractorProfile.find({ user: { $in: ids } })
      .select("user displayName primaryTrade profilePhotoUrl")
      .lean();
    const pfMap = new Map(profiles.map((p) => [String(p.user), p]));

    const out = users.map((u) => {
      const pf = pfMap.get(String(u._id));
      const name =
        `${u?.name?.first || ""} ${u?.name?.last || ""}`.trim() ||
        u?.email ||
        "—";
      const title =
        pf?.primaryTrade || (u?.isBusiness ? "Contractor" : u?.role || "");
      const avatarUrl = pf?.profilePhotoUrl || u?.avatarUrl || u?.image || "";
      return { id: String(u._id), name, title, avatarUrl };
    });

    res.json(out);
  } catch (e) {
    next(e);
  }
}
