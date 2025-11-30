import mongoose from "mongoose";

const resetPasswordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resetToken: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

resetPasswordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

resetPasswordSchema.index({ userId: 1, resetToken: 1 });

export const PasswordReset = mongoose.model(
  "PasswordReset",
  resetPasswordSchema
);
export default PasswordReset;
