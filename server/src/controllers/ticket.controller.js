
import mongoose from "mongoose";
import { randomBytes, createHash, createHmac } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

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

function operationIdFrom(body) {
  const id = body?.operationId;
  if (id !== undefined && (typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))) {
    throw httpError("Identificador de operación inválido", 400);
  }
  return id;
}

function generateCode(userId, operationId) {
  const random = operationId
    ? createHmac("sha256", process.env.JWT_SECRET)
        .update(`nam-plus/issue/v1:${userId}:${operationId}`)
        .digest("hex").slice(0, 32)
    : randomBytes(16).toString("hex");

  return `NAM-${random.toUpperCase()}`;
}

const emailPendingFor = 60_000;

function issuedTicketResponse(ticket, code, restaurantName, recipient) {
  const pending = ticket.emailSent === undefined && Date.now() - ticket.createdAt.getTime() < emailPendingFor;
  return {
    message: ticket.emailSent
      ? "Ticket generado y enviado por correo correctamente"
      : pending ? "Ticket generado. Correo en proceso." : "Ticket generado. El envío del correo no está confirmado.",
    ticket: {
      id: ticket._id, code, restaurantName,
      amountMXN: ticket.amountCents / 100, points: ticket.points,
      status: ticket.status, expiresAt: ticket.expiresAt,
    },
    email: { sent: ticket.emailSent === true, pending, recipient, error: ticket.emailError },
  };
}

function emailFailure(code) {
  if (code === "SMTP_CONFIG" || code === "EMAIL_IMAGE_CONFIG") return "configuration";
  if (code === "EAUTH") return "authentication";
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ETLS"].includes(code)) return "connection";
  if (code === "EENVELOPE") return "recipient";
  return "unknown";
}

async function deliverTicket(ticket, recipient, code, restaurantName) {
  try {
    await sendTicketEmail({
      recipient, code, restaurantName,
      amountMXN: ticket.amountCents / 100, points: ticket.points, expiresAt: ticket.expiresAt,
    });
    ticket.emailSent = true;
  } catch (error) {
    ticket.emailSent = false;
    ticket.emailError = emailFailure(error.code);
    console.error("Fallo de correo de cupón:", ticket.emailError);
  }

  try {
    await ticket.save();
  } catch (error) {
    console.error("No se pudo guardar el estado del correo del cupón:", error.name);
  }
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

    if (restaurantId !== undefined) {
      throw httpError("No puedes seleccionar otro restaurante", 403);
    }

    const restaurant = await Restaurant.findOne({ owner: req.userId, active: true });

    if (!restaurant) {
      throw httpError(
        "No se encontró un restaurante activo",
        404
      );
    }

    const operationId = operationIdFrom(req.body);
    const code = generateCode(req.userId, operationId);
    const codeHash = hashCode(code);
    const issuePayloadHash = hashCode(JSON.stringify([restaurant.id, amountCents, recipient]));
    const operationFilter = { issuedBy: req.userId, issueOperationId: operationId };

    const existingResponse = (ticket) => {
      if (ticket.issuePayloadHash !== issuePayloadHash || ticket.codeHash !== codeHash) {
        throw httpError("La operación ya fue registrada con otros datos o con una clave anterior.", 409);
      }
      // El cupón ya existe aunque el envío siga en curso.
      return res.status(200).json(issuedTicketResponse(ticket, code, restaurant.name, recipient));
    };

    if (operationId) {
      const existing = await Ticket.findOne(operationFilter);
      if (existing) return existingResponse(existing);
    }

    let ticket;
    try {
      ticket = await Ticket.create({
        restaurant: restaurant.id, codeHash, amountCents, points: 100,
        issuedBy: req.userId, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ...(operationId ? { issueOperationId: operationId, issuePayloadHash } : {}),
      });
    } catch (error) {
      if (!operationId || error.code !== 11000) throw error;
      const existing = await Ticket.findOne(operationFilter);
      if (!existing) throw error;
      return existingResponse(existing);
    }

    const delivery = deliverTicket(ticket, recipient, code, restaurant.name);
    // Devuelve el QR aunque el servidor de correo tarde en responder.
    await Promise.race([delivery, delay(5_000, undefined, { ref: false })]);

    return res.status(201).json(issuedTicketResponse(ticket, code, restaurant.name, recipient));
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
    const operationId = operationIdFrom(req.body);
    const codeHash = hashCode(code);

    session = await mongoose.startSession();

    let result = null;

    await session.withTransaction(async () => {
      // Solo puede reclamarse un ticket no usado.
      const ticket = await Ticket.findOneAndUpdate(
        {
          codeHash,
          status: "issued",
          expiresAt: { $gt: new Date() },
        },
        {
          $set: {
            status: "redeemed",
            redeemedBy: req.userId,
            redeemedAt: new Date(),
            ...(operationId ? { claimOperationId: operationId } : {}),
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!ticket) {
        const previous = operationId && await Ticket.findOne({
          codeHash, redeemedBy: req.userId, claimOperationId: operationId,
        }).populate("restaurant", "name").session(session);
        if (previous) {
          const account = await User.findById(req.userId).select("pointsBalance").session(session);
          result = {
            ticketId: previous.id, restaurantName: previous.restaurant?.name,
            pointsEarned: previous.points, balanceAfter: account?.pointsBalance ?? 0,
          };
          return;
        }
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
