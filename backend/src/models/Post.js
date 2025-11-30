import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    salary: { type: String, trim: true },
    requirements: { type: String, trim: true },
    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    embedding: { type: [Number], default: [] },
    acceptedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      set: (arr) => Array.from(new Set((arr || []).map((x) => x.toString()))),
    },
  },
  { timestamps: true }
);

postSchema.index({ publisher: 1, date: -1, createdAt: -1 });
postSchema.index({ "embedding.0": 1 });

export default mongoose.model("Post", postSchema);
