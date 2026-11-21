import { Router } from "express";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createRedemption,
  getMyRedemptions,
  getRestaurantRedemptions,
  completeRedemption,
  cancelRedemption,
  getPromotionCustomers,
} from "../controllers/redemption.controller.js";

const router = Router();

router.use(auth);

// 1. Realizar un canje con puntos
router.post(
  "/",
  requireRole("cliente"),
  createRedemption
);

// 2. Historial personal del cliente
router.get(
  "/history",
  getMyRedemptions
);

// 3. Historial de canjes del restaurante
router.get(
  "/restaurant",
  requireRole("restaurante", "admin"),
  getRestaurantRedemptions
);

// 4. Confirmar entrega
router.patch(
  "/:id/complete",
  requireRole("restaurante", "admin"),
  completeRedemption
);

// 5. Cancelar canje
router.patch(
  "/:id/cancel",
  requireRole("restaurante", "admin"),
  cancelRedemption
);

// 6. Ver clientes que canjearon una promoción propia
router.get(
  "/promotions/:promotionId/customers",
  requireRole("restaurante"),
  getPromotionCustomers
);

export default router;