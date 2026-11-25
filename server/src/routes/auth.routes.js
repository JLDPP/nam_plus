import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  registerAccount, loginAccount, getOwnAccount, updateOwnAccount,
  listAccounts, getAdminOverview, createAccount, updateAccount, adjustAccountPoints,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerAccount);
router.post("/login", loginAccount);
router.get("/me", auth, getOwnAccount);
router.patch("/me", auth, updateOwnAccount);
router.use("/accounts", auth, requireRole("admin"));
router.get("/accounts", listAccounts);
router.get("/accounts/overview", getAdminOverview);
router.post("/accounts", createAccount);
router.patch("/accounts/:id", updateAccount);
router.post("/accounts/:id/points", adjustAccountPoints);

export default router;
