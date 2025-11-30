import "dotenv/config.js";
import mongoose from "mongoose";
import Post from "../src/models/Post.js";
import { computePostEmbedding } from "../src/services/embedding.service.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/buildlink";
const FORCE_ALL = process.argv.includes("--all");

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("[reembed_posts] connected");

  const filter = FORCE_ALL ? {} : { "embedding.0": { $exists: false } };
  const cursor = Post.find(filter).cursor();

  let i = 0,
    updated = 0;
  for await (const p of cursor) {
    i++;
    const vec = await computePostEmbedding({
      title: p.title,
      content: p.content,
      location: p.location,
      salary: p.salary,
      requirements: p.requirements,
    });
    p.embedding = Array.isArray(vec) ? vec : [];
    await p.save();
    updated++;
    if (updated % 25 === 0) console.log(`...updated ${updated} posts`);
  }

  console.log(`[reembed_posts] scanned=${i} updated=${updated}`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("[reembed_posts] failed:", e);
  process.exit(1);
});
