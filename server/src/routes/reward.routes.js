
import { Router } from "express";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getRewards,
} from "../controllers/reward.controller.js";

import {
  getManagedRewards,
  createManagedReward,
  updateManagedReward,
  deactivateManagedReward,
} from "../controllers/rewardAdmin.controller.js";

const router = Router();

// ==========================================
// AUTENTICACIÓN
// ==========================================

router.use(auth);

// ==========================================
// 1. CATÁLOGO DE RECOMPENSAS
// ==========================================

// Conservar el catálogo actual para los clientes
router.get("/", getRewards);

// ==========================================
// 2. ADMINISTRACIÓN DE RECOMPENSAS
// ==========================================

// Consultar recompensas administrables
router.get(
  "/manage",
  requireRole("restaurante", "admin"),
  getManagedRewards
);

// Crear una nueva recompensa
router.post(
  "/manage",
  requireRole("restaurante", "admin"),
  createManagedReward
);

// Editar recompensa existente
router.patch(
  "/manage/:id",
  requireRole("restaurante", "admin"),
  updateManagedReward
);

// Desactivar recompensa sin eliminarla
router.patch(
  "/manage/:id/deactivate",
  requireRole("restaurante", "admin"),
  deactivateManagedReward
);

export default router;
