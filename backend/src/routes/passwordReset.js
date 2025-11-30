import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  requestPasswordReset,
  resetPassword,
} from "../controllers/passwordReset.controller.js";

const router = Router();

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts, please try again later.",
});

router.post("/forgot-password", forgotLimiter, requestPasswordReset);

router.post("/reset-password", resetPassword);

export default router;
