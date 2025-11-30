import mongoose from "mongoose";

const { Schema } = mongoose;
const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    from: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["comment", "mention", "request", "system"],
      required: true,
      index: true,
    },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment" },
    requestId: { type: Schema.Types.ObjectId, ref: "JobRequest" },
    message: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", NotificationSchema);
