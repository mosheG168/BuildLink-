import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  acceptJob,
  listMyJobs,
  updateJobStatus,
} from "../controllers/jobs.controller.js";

const router = Router();

router.post("/accept", auth, acceptJob);
router.get("/my", auth, listMyJobs);

router.patch("/:id/status", auth, updateJobStatus);

export default router;
