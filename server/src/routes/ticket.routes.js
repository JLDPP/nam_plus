
import { Router } from "express";
import { getTicketQrImage, ticketLogoPath } from "../services/ticketEmailImages.js";

import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  createTicket,
  claimTicket,
} from "../controllers/ticket.controller.js";

const router = Router();

// Los clientes de correo cargan las imágenes sin una sesión de Ñam+.
router.get("/email-images/logo.jpg", (_req, res) => res.sendFile(ticketLogoPath));
router.get("/email-images/qr/:token.png", getTicketQrImage);

// Las operaciones de tickets requieren autenticación.
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
