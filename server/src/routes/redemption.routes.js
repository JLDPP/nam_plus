
import { Router } from "express";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createRedemption,
  getMyRedemptions,
  getRestaurantRedemptions,
  completeRedemption,
  cancelRedemption,
} from "../controllers/redemption.controller.js";

const router = Router();

// ==========================================
// AUTENTICACIÓN JWT
// ==========================================

// Todas las rutas requieren autenticación
router.use(auth);

// ==========================================
// 1. REALIZAR CANJE CON PUNTOS
// ==========================================

// Solo clientes pueden canjear recompensas
router.post(
  "/",
  requireRole("cliente"),
  createRedemption
);

// ==========================================
// 2. HISTORIAL PERSONAL DEL CLIENTE
// ==========================================

router.get(
  "/history",
  getMyRedemptions
);

// ==========================================
// 3. CONSULTAR CANJES DEL RESTAURANTE
// ==========================================

router.get(
  "/restaurant",
  requireRole("restaurante", "admin"),
  getRestaurantRedemptions
);

// ==========================================
// 4. CONFIRMAR ENTREGA DE RECOMPENSA
// ==========================================

router.patch(
  "/:id/complete",
  requireRole("restaurante", "admin"),
  completeRedemption
);

// ==========================================
// 5. CANCELAR CANJE Y DEVOLVER PUNTOS
// ==========================================

router.patch(
  "/:id/cancel",
  requireRole("restaurante", "admin"),
  cancelRedemption
);

export default router;
