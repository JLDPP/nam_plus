import { Router } from "express";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getBalance,
  getHistory,
  findCustomer,
  transferPoints,
} from "../controllers/points.controller.js";

const router = Router();

router.use(auth);

// CLIENTES
router.get("/balance", getBalance);
router.get("/history", getHistory);

// RESTAURANTES
router.get(
  "/customer",
  requireRole("restaurante"),
  findCustomer
);

router.post(
  "/transfer",
  requireRole("restaurante"),
  transferPoints
);

export default router;