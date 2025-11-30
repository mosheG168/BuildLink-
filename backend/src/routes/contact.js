import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitContactForm } from "../controllers/contact.controller.js";

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, submitContactForm);

export default router;
