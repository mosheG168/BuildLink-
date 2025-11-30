import mongoose from "mongoose";
const { Schema, model } = mongoose;

const JobRequestSchema = new Schema(
  {
    origin: {
      type: String,
      enum: ["sub", "contractor"],
      default: "sub",
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    contractor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subcontractor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "denied",
        "cancelled",
        "withdrawn",
        "expired",
      ],
      default: "pending",
      index: true,
    },
    message: { type: String, default: "" },
    matchScore: { type: Number, default: null },
    matchedFields: { type: [String], default: [] },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

JobRequestSchema.index({ post: 1, subcontractor: 1 }, { unique: true });
JobRequestSchema.index(
  { contractor: 1, subcontractor: 1, status: 1, createdAt: -1 },
  { name: "contractor_subcontractor_status_createdAt_idx" }
);

JobRequestSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = _doc._id.toString();
    delete ret._id;
    return ret;
  },
});

export default model("JobRequest", JobRequestSchema);
