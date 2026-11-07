
import { Router } from "express";

import { auth } from "../middleware/auth.js";

import {
  getBalance,
  getHistory,
} from "../controllers/points.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Consultar saldo de puntos
router.get("/balance", getBalance);

// Consultar movimientos de puntos
router.get("/history", getHistory);

export default router;
