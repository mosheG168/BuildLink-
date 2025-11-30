import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  createJobRequest,
  listJobRequests,
  listMyJobRequests,
  acceptJobRequest,
  denyJobRequest,
  withdrawJobRequest,
  countPendingForContractor,
  inviteSubToPost,
  myRequestStatusForPosts,
} from "../controllers/jobRequests.controller.js";

const router = Router();

router.post("/", auth, createJobRequest);

router.post("/invite", auth, inviteSubToPost);

router.get("/", auth, listJobRequests);

router.get("/my", auth, listMyJobRequests);

router.get("/pending/count", auth, countPendingForContractor);

router.get("/my-status", auth, myRequestStatusForPosts);

router.patch("/:id/accept", auth, acceptJobRequest);
router.patch("/:id/deny", auth, denyJobRequest);
router.patch("/:id/withdraw", auth, withdrawJobRequest);

export default router;
