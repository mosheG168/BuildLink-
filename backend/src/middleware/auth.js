import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    const bearer = req.get("Authorization");
    const xToken = req.get("x-auth-token");
    const token =
      xToken || (bearer?.startsWith("Bearer ") ? bearer.slice(7) : null);

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    req.user._id = payload.sub;
    next();
  } catch (_err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
