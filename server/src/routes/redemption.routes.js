
import { Router } from "express";

import { auth } from "../middleware/auth.js";

import {
  createRedemption,
  getMyRedemptions,
} from "../controllers/redemption.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Realizar un canje
router.post("/", createRedemption);

// Consultar historial de canjes
router.get("/history", getMyRedemptions);

export default router;
