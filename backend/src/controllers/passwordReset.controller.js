import crypto from "crypto";
import bcrypt from "bcrypt";
import PasswordReset from "../models/PasswordReset.js";
import User from "../models/User.js";
import { sendMail } from "../services/mail.service.js";
import { resetPasswordSchema } from "../validators/users.validation.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res
        .status(400)
        .json({ error: "Email is required for password reset." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    const genericResponse = {
      message:
        "If an account exists for that email, a password reset link has been sent.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    await PasswordReset.deleteMany({ userId: user._id });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await PasswordReset.create({
      userId: user._id,
      resetToken: tokenHash,
      expiresAt,
    });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}&id=${user._id}`;

    await sendMail({
      to: user.email,
      subject: "Reset your password",
      text: `We received a request to reset your password.\n\nClick this link to set a new password:\n${resetLink}\n\nIf you didn't request this, you can ignore this email.`,
      html: `
        <p>We received a request to reset your password.</p>
        <p>
          <a href="${resetLink}" target="_blank" rel="noopener noreferrer">
            Click here to set a new password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });

    return res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, userId, password } = req.body || {};

    if (!token || !userId || !password) {
      return res
        .status(400)
        .json({ error: "token, userId and password are required." });
    }

    const { error } = resetPasswordSchema.validate({ password });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const tokenHash = hashToken(token);

    const resetDoc = await PasswordReset.findOne({
      userId,
      resetToken: tokenHash,
      expiresAt: { $gt: new Date() },
      usedAt: null,
    });

    if (!resetDoc) {
      return res
        .status(400)
        .json({ error: "The password reset link is invalid or has expired." });
    }

    const targetUserId = resetDoc.userId;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(String(password), salt);

    user.passwordHash = hashed;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    resetDoc.usedAt = new Date();
    await resetDoc.save();

    await PasswordReset.deleteMany({
      userId: targetUserId,
      _id: { $ne: resetDoc._id },
    });

    return res.json({
      message: "Password successfully reset. You can log in.",
      loginLink: `${FRONTEND_URL}/login`,
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    next(err);
  }
}
