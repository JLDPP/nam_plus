import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getBalance, getHistory } from "../controllers/points.controller.js";

const router = Router();
router.use(auth, requireRole("cliente"));
router.get("/balance", getBalance);
router.get("/history", getHistory);

export default router;
