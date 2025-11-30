import mongoose from "mongoose";
const { Schema, model, isValidObjectId } = mongoose;

const JobSchema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    contractor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workerRole: {
      type: String,
      enum: ["subcontractor", "contractor", "business"],
      required: true,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["accepted", "in_progress", "completed", "cancelled"],
      default: "accepted",
    },
  },
  { timestamps: true }
);

JobSchema.index({ post: 1, worker: 1 }, { unique: true });
JobSchema.index({ createdAt: -1 });

JobSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = _doc._id.toString();
    delete ret._id;
    return ret;
  },
});

export default model("Job", JobSchema);

export { isValidObjectId };
