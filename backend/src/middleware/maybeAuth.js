import jwt from "jsonwebtoken";

export default function maybeAuth(req, _res, next) {
  try {
    const token =
      req.header("x-auth-token") ||
      (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return next();
    const secret = process.env.JWT_SECRET || process.env.JWT_PRIVATE_KEY;
    if (!secret) return next();
    req.user = jwt.verify(token, secret);
  } catch {}
  next();
}
