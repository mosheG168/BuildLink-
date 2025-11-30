import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const commentSchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    publisher: { type: Types.ObjectId, ref: "User", required: true },
    post: { type: Types.ObjectId, ref: "Post", required: true },
    mentions: [{ type: Types.ObjectId, ref: "User" }],
    parent: { type: Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ publisher: 1, createdAt: -1 });

export default mongoose.model("Comment", commentSchema);
