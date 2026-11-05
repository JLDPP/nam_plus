/*
  ARCHIVO: promotion.routes.js

  FUNCIÓN:
  Define las rutas del módulo de promociones.

  PERMISOS:
  - Cualquier usuario puede consultar promociones.
  - Solo admin puede crear, modificar o eliminar.
*/

import { Router } from "express";

import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from "../controllers/promotion.controller.js";

import { auth } from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";

const router = Router();

// Consultar promociones
router.get("/", getPromotions);

router.get(
  "/:id",
  getPromotionById
);

// Solo ADMIN puede crear
router.post(
  "/",
  auth,
  adminOnly,
  createPromotion
);

// Solo ADMIN puede modificar
router.put(
  "/:id",
  auth,
  adminOnly,
  updatePromotion
);

// Solo ADMIN puede eliminar
router.delete(
  "/:id",
  auth,
  adminOnly,
  deletePromotion
);

export default router;