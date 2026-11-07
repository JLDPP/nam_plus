
import { Router } from "express";

import { auth } from "../middleware/auth.js";

import {
  getRewards,
} from "../controllers/reward.controller.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener recompensas disponibles
router.get("/", getRewards);

export default router;
