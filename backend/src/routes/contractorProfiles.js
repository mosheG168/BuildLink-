import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  getMe,
  upsertMe,
  deleteMe,
  verifyContractorLicense,
  deleteContractorLicense,
  setOpenForWork,
} from "../controllers/contractorProfile.controller.js";

const router = Router();

router.get("/me", auth, getMe);

router.put("/me", auth, upsertMe);

router.delete("/me", auth, deleteMe);

router.post("/verify", auth, verifyContractorLicense);

router.delete("/license", auth, deleteContractorLicense);

router.post("/open-for-work", auth, setOpenForWork);

export default router;
