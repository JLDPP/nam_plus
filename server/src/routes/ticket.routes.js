
import { Router } from "express";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createTicket,
  claimTicket,
} from "../controllers/ticket.controller.js";

const router = Router();

// Todas las rutas requieren autenticación.
router.use(auth);

// Restaurante o admin genera un ticket.
router.post(
  "/",
  requireRole("restaurante", "admin"),
  createTicket
);

// Cliente valida su ticket y obtiene puntos.
router.post(
  "/claim",
  requireRole("cliente"),
  claimTicket
);

export default router;
