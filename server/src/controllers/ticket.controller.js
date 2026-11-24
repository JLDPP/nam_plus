
import mongoose from "mongoose";
import { randomBytes, createHash } from "node:crypto";

import Ticket from "../models/Ticket.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import PointsTransaction from "../models/PointsTransaction.js";
import { sendTicketEmail } from "../services/ticketEmail.service.js";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function hashCode(code) {
  return createHash("sha256")
    .update(code)
    .digest("hex");
}

function generateCode() {
  const random = randomBytes(16)
    .toString("hex")
    .toUpperCase();

  return `NAM-${random}`;
}

function handleError(res, error) {
  console.error("Error de tickets:", error);

  const status = error.statusCode || 500;

  return res.status(status).json({
    message:
      status < 500
        ? error.message
        : "No fue posible procesar el ticket",
  });
}

// ==========================================
// 1. GENERAR TICKET DESDE RESTAURANTE
// ==========================================

export async function createTicket(req, res) {
  try {
    const currentUser = await User.findById(req.userId)
      .select("role");

    if (
      !currentUser ||
      !["restaurante", "admin"].includes(currentUser.role)
    ) {
      throw httpError(
        "No tienes permisos para generar tickets",
        403
      );
    }

    // ==========================================
    // RECIBIR DATOS DE LA COMPRA Y DEL CLIENTE
    // ==========================================

    const {
      amountMXN,
      restaurantId,
      customerEmail,
    } = req.body || {};

    // Validar correo electrónico del cliente
    if (
      typeof customerEmail !== "string" ||
      customerEmail.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())
    ) {
      throw httpError(
        "Ingresa un correo electrónico válido",
        400
      );
    }

    const recipient = customerEmail.trim();

    // ==========================================
    // VALIDAR IMPORTE DE COMPRA
    // ==========================================

    if (
      typeof amountMXN !== "number" ||
      !Number.isFinite(amountMXN) ||
      amountMXN < 0
    ) {
      throw httpError(
        "Ingresa un importe de compra válido",
        400
      );
    }

    // Evita errores de punto flotante y
    // limita importes de prueba a $1,000,000.
    const amountCents = Math.round(amountMXN * 100);

    if (
      !Number.isSafeInteger(amountCents) ||
      amountCents > 100000000
    ) {
      throw httpError(
        "El importe excede el límite permitido",
        400
      );
    }

    if (
      Math.abs(amountMXN * 100 - amountCents) > 0.000001
    ) {
      throw httpError(
        "El importe admite máximo dos decimales",
        400
      );
    }

    // Regla inicial: compras desde $500 reciben 100 puntos.
    if (amountCents < 50000) {
      throw httpError(
        "La compra debe ser de al menos $500 MXN",
        400
      );
    }

    // ==========================================
    // VALIDAR RESTAURANTE
    // ==========================================

    let restaurant;

    if (currentUser.role === "admin") {
      if (!mongoose.isValidObjectId(restaurantId)) {
        throw httpError(
          "Selecciona un restaurante válido",
          400
        );
      }

      restaurant = await Restaurant.findOne({
        _id: restaurantId,
        active: true,
      });
    } else {
      if (restaurantId !== undefined) {
        throw httpError(
          "No puedes seleccionar otro restaurante",
          403
        );
      }

      restaurant = await Restaurant.findOne({
        owner: req.userId,
        active: true,
      });
    }

    if (!restaurant) {
      throw httpError(
        "No se encontró un restaurante activo",
        404
      );
    }

    // ==========================================
    // GENERAR CÓDIGO ÚNICO DEL TICKET
    // ==========================================

    const code = generateCode();

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    // ==========================================
    // GUARDAR TICKET EN MONGODB
    // ==========================================

    const ticket = await Ticket.create({
      restaurant: restaurant._id,
      codeHash: hashCode(code),
      amountCents,
      points: 100,
      status: "issued",
      issuedBy: req.userId,
      expiresAt,
    });

    // ==========================================
    // ENVIAR TICKET QR POR CORREO ELECTRÓNICO
    // ==========================================

    let emailSent = false;

    try {
      await sendTicketEmail({
        recipient,
        code,
        restaurantName: restaurant.name,
        amountMXN: amountCents / 100,
        points: ticket.points,
        expiresAt: ticket.expiresAt,
      });

      emailSent = true;

      console.log(
        "Ticket enviado correctamente por correo"
      );
    } catch (emailError) {
      console.error(
        "Error al enviar el ticket por correo:",
        emailError
      );
    }

    // ==========================================
    // RESPUESTA AL FRONTEND
    // ==========================================

    // El código original se devuelve al generarlo.
    // No se almacena en texto plano.
    return res.status(201).json({
      message: emailSent
        ? "Ticket generado y enviado por correo correctamente"
        : "Ticket generado, pero no se pudo enviar el correo",
      ticket: {
        id: ticket._id,
        code,
        restaurantName: restaurant.name,
        amountMXN: amountCents / 100,
        points: ticket.points,
        status: ticket.status,
        expiresAt: ticket.expiresAt,
      },
      email: {
        sent: emailSent,
        recipient,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// 2. VALIDAR TICKET Y ACREDITAR PUNTOS
// ==========================================

export async function claimTicket(req, res) {
  const rawCode = req.body?.code;

  if (typeof rawCode !== "string") {
    return res.status(400).json({
      message: "Ingresa un código de ticket válido",
    });
  }

  const code = rawCode.trim().toUpperCase();

  if (!/^NAM-[A-F0-9]{32}$/.test(code)) {
    return res.status(400).json({
      message: "El formato del código no es válido",
    });
  }

  let session;

  try {
    const currentUser = await User.findById(req.userId)
      .select("role");

    if (!currentUser || currentUser.role !== "cliente") {
      throw httpError(
        "Solo los clientes pueden acumular puntos",
        403
      );
    }

    session = await mongoose.startSession();

    let result = null;

    await session.withTransaction(async () => {
      // Solo puede reclamarse un ticket no usado.
      const ticket = await Ticket.findOneAndUpdate(
        {
          codeHash: hashCode(code),
          status: "issued",
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "redeemed",
            redeemedBy: req.userId,
            redeemedAt: new Date(),
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!ticket) {
        throw httpError(
          "El ticket no existe, ya fue usado o está vencido",
          409
        );
      }

      const restaurant = await Restaurant.findOne({
        _id: ticket.restaurant,
        active: true,
      }).session(session);

      if (!restaurant) {
        throw httpError(
          "El restaurante de este ticket no está disponible",
          400
        );
      }

      // Compatibilidad con cuentas antiguas.
      await User.updateOne(
        {
          _id: req.userId,
          pointsBalance: { $exists: false },
        },
        {
          $set: { pointsBalance: 0 },
        },
        { session }
      );

      // Incrementar saldo de forma atómica.
      const user = await User.findOneAndUpdate(
        { _id: req.userId },
        {
          $inc: {
            pointsBalance: ticket.points,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!user) {
        throw httpError(
          "No se encontró la cuenta del cliente",
          404
        );
      }

      // Registrar movimiento en el historial.
      await PointsTransaction.create(
        [
          {
            user: req.userId,
            type: "earn",
            points: ticket.points,
            balanceAfter: user.pointsBalance,
            description:
              `Puntos por compra en ${restaurant.name}`,
            reference: ticket._id.toString(),
          },
        ],
        { session }
      );

      result = {
        ticketId: ticket._id,
        restaurantName: restaurant.name,
        pointsEarned: ticket.points,
        balanceAfter: user.pointsBalance,
      };
    });

    return res.json({
      message: `¡Ganaste ${result.pointsEarned} puntos!`,
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
