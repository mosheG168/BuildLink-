import "dotenv/config.js";
import mongoose from "mongoose";
import ContractorProfile from "../src/models/ContractorProfile.js";
import { computeAndSaveProfileEmbedding } from "../src/services/embedding.service.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/buildlink";
const ONLY_OPEN = process.argv.includes("--open");

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("[reembed_profiles] connected");

  const filter = ONLY_OPEN ? { openForWork: true } : {};
  const cursor = ContractorProfile.find(filter).cursor();

  let i = 0,
    updated = 0,
    failed = 0;
  for await (const prof of cursor) {
    i++;
    try {
      await computeAndSaveProfileEmbedding(prof);
      updated++;
      if (updated % 25 === 0) console.log(`...updated ${updated} profiles`);
    } catch (e) {
      failed++;
      console.error(`[profile ${prof._id}] failed:`, e?.message);
    }
  }

  console.log(
    `[reembed_profiles] scanned=${i} updated=${updated} failed=${failed}`
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("[reembed_profiles] failed:", e);
  process.exit(1);
});
