import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Post from "../src/models/Post.js";
import User from "../src/models/User.js";
import Comment from "../src/models/Comment.js";
import Notification from "../src/models/Notification.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/buildlink";

async function connect() {
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log("✅ Connected to MongoDB");
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSalary() {
  const min = Math.floor(Math.random() * 80) + 30;
  const max = min + Math.floor(Math.random() * 40) + 5;
  return `$${min}k-$${max}k`;
}

const SAMPLE_TITLES = [
  "Carpenter Needed",
  "Experienced Electrician",
  "Plumbing Technician",
  "Site Supervisor",
  "Painter / Finisher",
  "HVAC Installer",
  "Flooring Specialist",
  "General Laborer",
  "Project Manager",
  "Concrete Finisher",
];

const SAMPLE_LOCATIONS = [
  "Tel Aviv",
  "Haifa",
  "Jerusalem",
  "Beer Sheva",
  "Ramat Gan",
  "Petah Tikva",
];

const SAMPLE_REQUIREMENTS = [
  "3+ years experience",
  "Valid trade license",
  "Own tools preferred",
  "Able to travel to site",
  "Good communication skills",
  "Background check required",
];

const SAMPLE_CONTENT = [
  "We are looking for a reliable worker to join our team for ongoing projects.",
  "Short-term contract with potential for extension. Competitive pay.",
  "Must be able to work full-time and follow site safety procedures.",
  "Join a friendly team and work on high-profile residential projects.",
];

async function ensureSeedUser() {
  const seedEmail = process.env.SEED_USER_EMAIL || "seed@buildlink.local";
  let user = await User.findOne({ email: seedEmail });
  if (user) return user;

  const seed = {
    name: { first: "Seed", middle: "", last: "User" },
    phone: "0000000000",
    email: seedEmail,
    passwordHash: "seed-hash",
    address: {
      country: "Israel",
      city: "Tel Aviv",
      street: "Seed St",
      houseNumber: 1,
      zip: 12345,
    },
    isBusiness: false,
    role: "subcontractor",
  };

  user = await User.create(seed);
  console.log("🔹 Created seed user:", user.email);
  return user;
}

async function ensureExtraSeedUsers(count = 2) {
  const targets = Array.from({ length: Math.max(0, count) }, (_, i) => ({
    email: `seed+${i + 1}@buildlink.local`,
    name: { first: "Seed", middle: "", last: `Commenter${i + 1}` },
  }));

  const users = [];
  for (const t of targets) {
    let u = await User.findOne({ email: t.email });
    if (!u) {
      u = await User.create({
        name: t.name,
        phone: "0000000000",
        email: t.email,
        passwordHash: "seed-hash",
        address: {
          country: "Israel",
          city: "Tel Aviv",
          street: "Commenters Ave",
          houseNumber: 1,
          zip: 12345,
        },
        isBusiness: false,
        role: "subcontractor",
      });
      console.log("🔹 Created extra seed user:", u.email);
    }
    users.push(u);
  }
  return users;
}

async function getEmbedding(text) {
  const embedUrl = process.env.PY_EMBED_URL || "http://localhost:8000/embed";
  try {
    const resp = await axios.post(
      embedUrl,
      { text, provider: "huggingface" },
      { timeout: 10000 }
    );
    if (resp?.data?.embedding) return resp.data.embedding;
    return null;
  } catch (err) {
    console.warn("⚠️  Embedding request failed:", err.message);
    return null;
  }
}

async function seedCommentsForPosts(posts, commenters = [], perPost = 2) {
  if (!Array.isArray(posts) || posts.length === 0) return;
  const pool = Array.isArray(commenters) && commenters.length ? commenters : [];
  for (const p of posts) {
    const howMany = Math.floor(Math.random() * (perPost + 1)); // 0..perPost
    for (let i = 0; i < howMany; i++) {
      const who = pool[Math.floor(Math.random() * pool.length)] || null;
      if (!who) break;
      const c = await Comment.create({
        post: p._id,
        publisher: who._id,
        content: [
          "Looks great!",
          "Interested.",
          "Can you share more details?",
          "DM sent.",
        ][Math.floor(Math.random() * 4)],
      });
      if (String(p.publisher) !== String(who._id)) {
        await Notification.create({
          recipient: p.publisher,
          from: who._id,
          type: "comment",
          post: p._id,
          comment: c._id,
        });
      }
    }
  }
}

async function main() {
  await connect();

  const user = await ensureSeedUser();
  const extraCommenters = await ensureExtraSeedUsers(2);
  const commenters = [user, ...extraCommenters];

  const rawCount = Number(process.argv[2]) || 100;
  const useEmbedding = process.argv.includes("--no-embed") ? false : true;
  console.log(
    `Preparing to insert ${rawCount} jobs (embeddings: ${useEmbedding})`
  );

  const created = [];
  for (let i = 0; i < rawCount; i++) {
    const title =
      rand(SAMPLE_TITLES) +
      (Math.random() < 0.2
        ? ` - Urgent ${Math.floor(Math.random() * 1000)}`
        : "");
    const location = rand(SAMPLE_LOCATIONS);
    const salary = randomSalary();
    const content = rand(SAMPLE_CONTENT);
    const requirements = Array.from({
      length: 2 + Math.floor(Math.random() * 3),
    })
      .map(() => rand(SAMPLE_REQUIREMENTS))
      .join("; ");

    const combinedText = `${title} ${content} ${requirements}`;

    let embedding = [];
    if (useEmbedding) {
      const emb = await getEmbedding(combinedText).catch(() => null);
      if (Array.isArray(emb)) embedding = emb;
    }

    const date = new Date(
      Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 60)
    );

    const doc = {
      title,
      content,
      location,
      salary,
      requirements,
      publisher: user._id,
      embedding,
      date,
    };

    const createdDoc = await Post.create(doc);
    created.push(createdDoc);
    if ((i + 1) % 10 === 0)
      process.stdout.write(`Inserted ${i + 1}/${rawCount}...\n`);
  }

  console.log(
    `✅ Inserted ${created.length} jobs. Sample id: ${created[0]?._id}`
  );

  await seedCommentsForPosts(created, commenters, 2);
  console.log("💬 Seeded comments and notifications for posts.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
