import mongoose from "mongoose";

import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Promotion from "../models/Promotion.js";
import Redemption from "../models/Redemption.js";
import PointsTransaction from "../models/PointsTransaction.js";
import Restaurant from "../models/Restaurant.js";

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Las pantallas de historial leen reward.name.
// Las promociones guardan ese nombre en title.
const rewardDetails = {
  path: "reward",
  select: "name title restaurant restaurantName imageUrl",
  transform(doc) {
    if (!doc) return null;

    const item = doc.toObject ? doc.toObject() : doc;

    return {
      ...item,
      name: item.name ?? item.title,
    };
  },
};

// ==========================================
// 1. REALIZAR CANJE CON PUNTOS
// ==========================================

export async function createRedemption(req, res) {
  const { rewardId, promotionId, expectedPointsCost } = req.body ?? {};

  const esPromocion = promotionId !== undefined;
  const itemId = esPromocion ? promotionId : rewardId;
  const Catalogo = esPromocion ? Promotion : Reward;

  if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
    return res.status(400).json({
      message: "El artículo seleccionado para canje no es válido.",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();
    let resultado;

    await session.withTransaction(async () => {
      const articulo = await Catalogo.findOne({
        _id: itemId,
        active: true,
      }).session(session);

      if (!articulo) {
        throw httpError("El artículo no existe o está desactivado.", 404);
      }

      if (esPromocion) {
        const ahora = new Date();

        if (
          (articulo.startDate && articulo.startDate > ahora) ||
          (articulo.endDate && articulo.endDate < ahora)
        ) {
          throw httpError("Esta promoción está fuera de vigencia.", 409);
        }
      }

      // El costo real siempre se toma de MongoDB.
      const costo = articulo.pointsCost;

      if (!Number.isSafeInteger(costo) || costo < 1) {
        throw httpError("Este artículo no tiene un costo de canje válido.", 400);
      }

      if (esPromocion && expectedPointsCost !== costo) {
        throw httpError(
          "El costo cambió. Actualiza la promoción antes de canjear.",
          409
        );
      }

      if (!Number.isSafeInteger(articulo.stock) || articulo.stock < 1) {
        throw httpError("Este artículo está agotado.", 400);
      }

      // Compatibilidad con cuentas antiguas.
      await User.updateOne(
        {
          _id: req.userId,
          pointsBalance: { $exists: false },
        },
        { $set: { pointsBalance: 0 } },
        { session }
      );

      const user = await User.findOneAndUpdate(
        {
          _id: req.userId,
          pointsBalance: { $gte: costo },
        },
        { $inc: { pointsBalance: -costo } },
        { new: true, session }
      );

      if (!user) {
        throw httpError(
          "No tienes suficientes puntos para realizar este canje.",
          400
        );
      }

      const inventario = await Catalogo.updateOne(
        {
          _id: articulo._id,
          active: true,
          stock: { $gt: 0 },
        },
        { $inc: { stock: -1 } },
        { session }
      );

      if (inventario.modifiedCount !== 1) {
        throw httpError("El artículo acaba de agotarse.", 409);
      }

      const [redemption] = await Redemption.create(
        [{
          user: req.userId,
          reward: articulo._id,
          rewardModel: Catalogo.modelName,
          pointsSpent: costo,
          status: "pending",
        }],
        { session }
      );

      const nombre = articulo.name ?? articulo.title;

      await PointsTransaction.create(
        [{
          user: req.userId,
          type: "redeem",
          points: costo,
          balanceAfter: user.pointsBalance,
          description: `Canje de recompensa: ${nombre}`,
          reference: redemption._id.toString(),
        }],
        { session }
      );

      resultado = {
        message: "Canje realizado correctamente.",
        pointsBalance: user.pointsBalance,
        redemption: {
          ...redemption.toObject(),
          reward: {
            _id: articulo._id,
            name: nombre,
            restaurantName: articulo.restaurantName,
            imageUrl: articulo.imageUrl,
          },
        },
      };
    });

    return res.status(201).json(resultado);
  } catch (error) {
    console.error("Error realizando canje:", error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Error al realizar el canje.",
    });
  } finally {
    if (session) await session.endSession();
  }
}

// ==========================================
// 2. HISTORIAL PERSONAL DEL CLIENTE
// ==========================================

export async function getMyRedemptions(req, res) {
  try {
    const redemptions = await Redemption.find({ user: req.userId })
      .populate(rewardDetails)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(redemptions);
  } catch (error) {
    console.error("Error consultando historial de canjes:", error);

    return res.status(500).json({
      message: "Error al consultar el historial de canjes.",
    });
  }
}

// ==========================================
// 3. CONSULTAR CANJES DEL RESTAURANTE
// ==========================================

export async function getRestaurantRedemptions(req, res) {
  try {
    const currentUser = await User.findById(req.userId).select("role");

    if (!currentUser || !["restaurante", "admin"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "No tienes permisos para consultar estos canjes.",
      });
    }

    const filter =
      currentUser.role === "admin"
        ? { active: true }
        : { owner: req.userId, active: true };

    const restaurantIds = await Restaurant.distinct("_id", filter);
    const filtroCatalogo = { restaurant: { $in: restaurantIds } };

    const [rewardIds, promotionIds] = await Promise.all([
      Reward.distinct("_id", filtroCatalogo),
      Promotion.distinct("_id", filtroCatalogo),
    ]);

    const redemptions = await Redemption.find({
      $or: [
        {
          rewardModel: "Promotion",
          reward: { $in: promotionIds },
        },
        {
          rewardModel: { $in: [null, "Reward"] },
          reward: { $in: rewardIds },
        },
      ],
    })
      .populate(rewardDetails)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(redemptions);
  } catch (error) {
    console.error("Error consultando canjes del restaurante:", error);

    return res.status(500).json({
      message: "Error al consultar los canjes del restaurante.",
    });
  }
}

// ==========================================
// 4. CONFIRMAR ENTREGA
// ==========================================

export async function completeRedemption(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de canje inválido." });
    }

    const currentUser = await User.findById(req.userId).select("role");

    if (!currentUser || !["restaurante", "admin"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "No tienes permisos para confirmar canjes.",
      });
    }

    const redemption = await Redemption.findById(id).populate("reward");

    if (!redemption) {
      return res.status(404).json({ message: "Canje no encontrado." });
    }

    if (redemption.status !== "pending") {
      return res.status(409).json({ message: "Este canje ya fue procesado." });
    }

    if (!redemption.reward?.restaurant) {
      return res.status(400).json({
        message: "El artículo no tiene un restaurante asignado.",
      });
    }

    if (currentUser.role === "restaurante") {
      const restaurant = await Restaurant.exists({
        _id: redemption.reward.restaurant,
        owner: req.userId,
        active: true,
      });

      if (!restaurant) {
        return res.status(403).json({
          message: "No puedes confirmar canjes de otro restaurante.",
        });
      }
    }

    const updated = await Redemption.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "completed" } },
      { new: true }
    ).populate(rewardDetails);

    if (!updated) {
      return res.status(409).json({ message: "Este canje ya fue procesado." });
    }

    return res.json({
      message: "Entrega confirmada correctamente.",
      redemption: updated,
    });
  } catch (error) {
    console.error("Error confirmando canje:", error);

    return res.status(500).json({
      message: "Error al confirmar la entrega.",
    });
  }
}

// ==========================================
// 5. CANCELAR CANJE Y DEVOLVER PUNTOS
// ==========================================

export async function cancelRedemption(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID de canje inválido." });
  }

  let session;

  try {
    const currentUser = await User.findById(req.userId).select("role");

    if (!currentUser || !["restaurante", "admin"].includes(currentUser.role)) {
      return res.status(403).json({
        message: "No tienes permisos para cancelar canjes.",
      });
    }

    session = await mongoose.startSession();
    let resultado;

    await session.withTransaction(async () => {
      const redemption = await Redemption.findById(id).session(session);

      if (!redemption) {
        throw httpError("Canje no encontrado.", 404);
      }

      if (redemption.status !== "pending") {
        throw httpError("Solo puedes cancelar canjes pendientes.", 409);
      }

      const Catalogo =
        redemption.rewardModel === "Promotion" ? Promotion : Reward;

      const articulo = await Catalogo.findById(redemption.reward).session(session);

      if (!articulo?.restaurant) {
        throw httpError("El artículo no tiene un restaurante asignado.", 400);
      }

      if (currentUser.role === "restaurante") {
        const restaurant = await Restaurant.exists({
          _id: articulo.restaurant,
          owner: req.userId,
          active: true,
        }).session(session);

        if (!restaurant) {
          throw httpError("No puedes cancelar canjes de otro restaurante.", 403);
        }
      }

      const updated = await Redemption.findOneAndUpdate(
        { _id: id, status: "pending" },
        { $set: { status: "cancelled" } },
        { new: true, session }
      );

      if (!updated) {
        throw httpError("Este canje ya fue procesado.", 409);
      }

      const user = await User.findByIdAndUpdate(
        redemption.user,
        { $inc: { pointsBalance: redemption.pointsSpent } },
        { new: true, session }
      );

      if (!user) {
        throw httpError("Usuario del canje no encontrado.", 404);
      }

      const stockResult = await Catalogo.updateOne(
        { _id: articulo._id },
        { $inc: { stock: 1 } },
        { session }
      );

      if (stockResult.matchedCount !== 1) {
        throw new Error("No fue posible restaurar el inventario.");
      }

      const nombre = articulo.name ?? articulo.title;

      await PointsTransaction.create(
        [{
          user: redemption.user,
          type: "adjustment",
          points: redemption.pointsSpent,
          balanceAfter: user.pointsBalance,
          description: `Devolución por canje cancelado: ${nombre}`,
          reference: redemption._id.toString(),
        }],
        { session }
      );

      resultado = {
        ...updated.toObject(),
        reward: {
          _id: articulo._id,
          name: nombre,
          restaurantName: articulo.restaurantName,
          imageUrl: articulo.imageUrl,
        },
      };
    });

    return res.json({
      message: "Canje cancelado y puntos devueltos correctamente.",
      redemption: resultado,
    });
  } catch (error) {
    console.error("Error cancelando canje:", error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Error al cancelar el canje.",
    });
  } finally {
    if (session) await session.endSession();
  }
}

// ==========================================
// 6. VER CLIENTES DE UNA PROMOCIÓN PROPIA
// ==========================================

export async function getPromotionCustomers(req, res) {
  try {
    const { promotionId } = req.params;

    if (!req.userId) {
      return res.status(401).json({
        message: "Inicia sesión para consultar los canjes.",
      });
    }

    if (!/^[a-f\d]{24}$/i.test(promotionId)) {
      return res.status(400).json({
        message: "El ID de la promoción no es válido.",
      });
    }

    const restaurantIds = await Restaurant.distinct("_id", {
      owner: req.userId,
      active: true,
    });

    const promotion = await Promotion.findOne({
      _id: promotionId,
      restaurant: { $in: restaurantIds },
    }).select("_id");

    if (!promotion) {
      return res.status(404).json({
        message: "Promoción no encontrada en tus restaurantes.",
      });
    }

    const canjes = await Redemption.find({
      reward: promotion._id,
      rewardModel: "Promotion",
    })
      .select("user createdAt pointsSpent status")
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      canjes.map((canje) => ({
        _id: canje._id,
        customerName: canje.user?.name || "Cliente sin nombre disponible",
        createdAt: canje.createdAt,
        pointsSpent: canje.pointsSpent,
        status: canje.status,
      }))
    );
  } catch (error) {
    console.error("Error consultando clientes de la promoción:", error);

    return res.status(500).json({
      message: "No se pudieron consultar los clientes.",
    });
  }
}