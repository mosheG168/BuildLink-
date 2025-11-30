import mongoose from "mongoose";
import sharedRoles from "../../../shared/roles.js";
const { ROLES, ROLE_LIST } = sharedRoles;

const nameSub = new mongoose.Schema(
  {
    first: { type: String, required: true, trim: true },
    middle: { type: String, default: "", trim: true },
    last: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const imageSub = new mongoose.Schema(
  {
    url: { type: String, default: "" },
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const addressSub = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    houseNumber: { type: Number, required: true },
    zip: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: nameSub, required: true },
    phone: { type: String, required: true, trim: true }, // format enforced by Joi
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    image: { type: imageSub, default: () => ({}) },
    address: { type: addressSub, required: true },
    isBusiness: { type: Boolean, required: true },
    role: {
      type: String,
      enum: ROLE_LIST,
      required: true,
      default: ROLES.SUBCONTRACTOR,
    },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.index({ "name.first": 1 });
userSchema.index({ "name.last": 1 });

userSchema.path("email").set((v) => (v ? v.trim().toLowerCase() : v));

const User = mongoose.model("User", userSchema);
export default User;
