import express, { Router } from "express";

import {
  getPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  getMyPromotions,
  createRestaurantPromotion,
  updateRestaurantPromotion,
} from "../controllers/promotion.controller.js";

import { auth } from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  imageDirectory,
  readPromotionUpload,
} from "../middleware/promotionImage.js";

const router = Router();

// Mostrar imágenes guardadas en server/uploads/promociones
router.use(
  "/images",
  express.static(imageDirectory, { index: false })
);

// ==========================================
// RUTAS EXCLUSIVAS PARA RESTAURANTES
// ==========================================

// Consultar promociones propias
router.get(
  "/mine",
  auth,
  requireRole("restaurante"),
  getMyPromotions
);

// Publicar promoción
router.post(
  "/mine/:restaurantId",
  auth,
  requireRole("restaurante"),
  readPromotionUpload,
  createRestaurantPromotion
);

// Editar o desactivar promoción
router.patch(
  "/mine/:restaurantId/:id",
  auth,
  requireRole("restaurante"),
  readPromotionUpload,
  updateRestaurantPromotion
);

// ==========================================
// RUTAS GENERALES
// ==========================================

// Consultar todas las promociones
router.get("/", getPromotions);

// Consultar promoción por ID
router.get("/:id", getPromotionById);

// ==========================================
// RUTAS EXCLUSIVAS PARA ADMINISTRADORES
// ==========================================

router.post(
  "/",
  auth,
  adminOnly,
  createPromotion
);

router.put(
  "/:id",
  auth,
  adminOnly,
  updatePromotion
);

router.delete(
  "/:id",
  auth,
  adminOnly,
  deletePromotion
);

export default router;