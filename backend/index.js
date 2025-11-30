import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import mongoose from "mongoose";
import morgan from "morgan";
import path from "path";
import commentsRouter from "./src/routes/comment.js";
import postsRouter from "./src/routes/posts.js";
import usersRouter from "./src/routes/users.js";
import contractorProfilesRouter from "./src/routes/contractorProfiles.js";
import uploadsRouter from "./src/routes/uploads.js";
import jobsRouter from "./src/routes/jobs.js";
import jobRequestsRouter from "./src/routes/jobRequests.js";
import notificationsRouter from "./src/routes/notifications.js";
import passwordResetRoutes from "./src/routes/passwordReset.js";
import contactRoutes from "./src/routes/contact.js";

const ENV_FILE = process.env.ENV_FILE || ".env";
dotenv.config({ path: ENV_FILE });

const app = express();
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(`❌ Missing MONGO_URI in ${ENV_FILE}`);
  process.exit(1);
}

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    allowedHeaders: "Content-Type, Accept, Authorization, x-auth-token",
  })
);

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "365d",
    etag: true,
  })
);

app.set("etag", false);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use("/api/uploads", uploadsRouter);
app.use("/api/contractor-profiles", contractorProfilesRouter);
app.use("/api/users", usersRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/job-requests", jobRequestsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/contact", contactRoutes);
app.get("/", (_req, res) => res.json({ message: "API is running" }));

app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      const logDir = path.join(process.cwd(), "logs");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
      const logFile = path.join(
        logDir,
        `${new Date().toISOString().slice(0, 10)}.log`
      );
      const errorMessage = res.locals.errorMessage || res.statusMessage || "";
      fs.appendFileSync(
        logFile,
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${
          res.statusCode
        } ${errorMessage}\n`
      );
    }
  });
  next();
});

app.use((req, res) => {
  res.status(404);
  res.locals.errorMessage = "Route not found";
  res.json({ error: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Error:", err);
  res.locals.errorMessage = err.message;
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const host = MONGO_URI.includes("@")
      ? MONGO_URI.split("@")[1]?.split("/")[0]
      : "local";
    console.log(`✅ MongoDB connected: ${host}`);

    app.listen(PORT, () =>
      console.log(
        `🚀 Server ready: http://localhost:${PORT}  (env: ${ENV_FILE})`
      )
    );
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

start();
