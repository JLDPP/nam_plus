
import mongoose from "mongoose";

import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Redemption from "../models/Redemption.js";
import PointsTransaction from "../models/PointsTransaction.js";
import Restaurant from "../models/Restaurant.js";

// ==========================================
// FUNCIÓN AUXILIAR PARA ERRORES HTTP
// ==========================================
function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// ==========================================
// 1. REALIZAR CANJE CON PUNTOS
// ==========================================
export async function createRedemption(req, res) {
  const { rewardId } = req.body;

  if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({
      message: "La recompensa seleccionada no es válida",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();
    let createdRedemption = null;

    await session.withTransaction(async () => {
      const reward = await Reward.findOne({
        _id: rewardId,
        active: true,
      }).session(session);

      if (!reward) {
        throw httpError(
          "La recompensa no existe o está desactivada",
          404
        );
      }

      if (reward.stock <= 0) {
        throw httpError(
          "Esta recompensa se encuentra agotada",
          400
        );
      }

      if (
        !Number.isSafeInteger(reward.pointsCost) ||
        reward.pointsCost < 1
      ) {
        throw httpError(
          "El costo de esta recompensa no es válido",
          400
        );
      }

      // Inicializar puntos de usuarios antiguos
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

      // Descontar puntos de forma atómica
      const user = await User.findOneAndUpdate(
        {
          _id: req.userId,
          pointsBalance: { $gte: reward.pointsCost },
        },
        {
          $inc: {
            pointsBalance: -reward.pointsCost,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!user) {
        throw httpError(
          "No tienes suficientes puntos para realizar este canje",
          400
        );
      }

      // Descontar inventario
      const updatedReward = await Reward.findOneAndUpdate(
        {
          _id: rewardId,
          active: true,
          stock: { $gt: 0 },
        },
        {
          $inc: { stock: -1 },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedReward) {
        throw httpError(
          "La recompensa acaba de agotarse",
          409
        );
      }

      // Registrar canje
      const redemption = await Redemption.create(
        [
          {
            user: req.userId,
            reward: reward._id,
            pointsSpent: reward.pointsCost,
            status: "pending",
          },
        ],
        { session }
      );

      // Registrar movimiento de puntos
      await PointsTransaction.create(
        [
          {
            user: req.userId,
            type: "redeem",
            points: reward.pointsCost,
            balanceAfter: user.pointsBalance,
            description: `Canje de recompensa: ${reward.name}`,
            reference: redemption[0]._id.toString(),
          },
        ],
        { session }
      );

      createdRedemption = redemption[0];
    });

    const result = await Redemption.findById(
      createdRedemption._id
    ).populate(
      "reward",
      "name restaurantName imageUrl"
    );

    return res.status(201).json({
      message: "Canje realizado correctamente",
      redemption: result,
    });
  } catch (error) {
    console.error("Error realizando canje:", error);

    return res.status(error.statusCode || 500).json({
      message: error.message || "Error al realizar el canje",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// ==========================================
// 2. HISTORIAL PERSONAL DEL CLIENTE
// ==========================================
export async function getMyRedemptions(req, res) {
  try {
    const redemptions = await Redemption.find({
      user: req.userId,
    })
      .populate(
        "reward",
        "name restaurantName imageUrl"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json(redemptions);
  } catch (error) {
    console.error(
      "Error consultando historial de canjes:",
      error
    );

    return res.status(500).json({
      message: "Error al consultar el historial de canjes",
    });
  }
}

// ==========================================
// 3. CONSULTAR CANJES DEL RESTAURANTE
// ==========================================
export async function getRestaurantRedemptions(req, res) {
  try {
    const currentUser = await User.findById(req.userId)
      .select("role");

    if (
      !currentUser ||
      !["restaurante", "admin"].includes(currentUser.role)
    ) {
      return res.status(403).json({
        message: "No tienes permisos para consultar estos canjes",
      });
    }

    // Admin consulta restaurantes activos.
    // Restaurante consulta únicamente los suyos.
    const filter =
      currentUser.role === "admin"
        ? { active: true }
        : {
            owner: req.userId,
            active: true,
          };

    const restaurants = await Restaurant.find(filter)
      .select("_id");

    const restaurantIds = restaurants.map(
      (restaurant) => restaurant._id
    );

    const rewards = await Reward.find({
      restaurant: { $in: restaurantIds },
    }).select("_id");

    const rewardIds = rewards.map(
      (reward) => reward._id
    );

    const redemptions = await Redemption.find({
      reward: { $in: rewardIds },
    })
      .populate(
        "reward",
        "name restaurantName imageUrl"
      )
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(redemptions);
  } catch (error) {
    console.error(
      "Error consultando canjes del restaurante:",
      error
    );

    return res.status(500).json({
      message: "Error al consultar los canjes del restaurante",
    });
  }
}

// ==========================================
// 4. CONFIRMAR ENTREGA DE RECOMPENSA
// ==========================================
export async function completeRedemption(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID de canje inválido",
      });
    }

    const currentUser = await User.findById(req.userId)
      .select("role");

    if (
      !currentUser ||
      !["restaurante", "admin"].includes(currentUser.role)
    ) {
      return res.status(403).json({
        message: "No tienes permisos para confirmar canjes",
      });
    }

    const redemption = await Redemption.findById(id)
      .populate("reward");

    if (!redemption) {
      return res.status(404).json({
        message: "Canje no encontrado",
      });
    }

    if (redemption.status !== "pending") {
      return res.status(409).json({
        message: "Este canje ya fue procesado",
      });
    }

    if (!redemption.reward?.restaurant) {
      return res.status(400).json({
        message: "La recompensa no tiene un restaurante asignado",
      });
    }

    // Validar propiedad del restaurante
    if (currentUser.role === "restaurante") {
      const restaurant = await Restaurant.findOne({
        _id: redemption.reward.restaurant,
        owner: req.userId,
        active: true,
      });

      if (!restaurant) {
        return res.status(403).json({
          message: "No puedes confirmar canjes de otro restaurante",
        });
      }
    }

    // Cambiar estado solamente si sigue pendiente
    const updated = await Redemption.findOneAndUpdate(
      {
        _id: id,
        status: "pending",
      },
      {
        $set: { status: "completed" },
      },
      {
        new: true,
      }
    ).populate(
      "reward",
      "name restaurantName imageUrl"
    );

    if (!updated) {
      return res.status(409).json({
        message: "Este canje ya fue procesado",
      });
    }

    return res.json({
      message: "Entrega confirmada correctamente",
      redemption: updated,
    });
  } catch (error) {
    console.error("Error confirmando canje:", error);

    return res.status(500).json({
      message: "Error al confirmar la entrega",
    });
  }
}

// ==========================================
// 5. CANCELAR CANJE Y DEVOLVER PUNTOS
// ==========================================
export async function cancelRedemption(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: "ID de canje inválido",
    });
  }

  let session;

  try {
    // Verificar rol vigente
    const currentUser = await User.findById(req.userId)
      .select("role");

    if (
      !currentUser ||
      !["restaurante", "admin"].includes(currentUser.role)
    ) {
      return res.status(403).json({
        message: "No tienes permisos para cancelar canjes",
      });
    }

    session = await mongoose.startSession();

    let cancelledId = null;

    await session.withTransaction(async () => {
      // Buscar canje dentro de la transacción
      const redemption = await Redemption.findById(id)
        .session(session);

      if (!redemption) {
        throw httpError("Canje no encontrado", 404);
      }

      if (redemption.status !== "pending") {
        throw httpError(
          "Solo puedes cancelar canjes pendientes",
          409
        );
      }

      // Consultar recompensa
      const reward = await Reward.findById(
        redemption.reward
      ).session(session);

      if (!reward?.restaurant) {
        throw httpError(
          "La recompensa no tiene un restaurante asignado",
          400
        );
      }

      // Verificar que el usuario sea propietario
      if (currentUser.role === "restaurante") {
        const restaurant = await Restaurant.findOne({
          _id: reward.restaurant,
          owner: req.userId,
          active: true,
        }).session(session);

        if (!restaurant) {
          throw httpError(
            "No puedes cancelar canjes de otro restaurante",
            403
          );
        }
      }

      // Evitar cancelaciones duplicadas
      const updated = await Redemption.findOneAndUpdate(
        {
          _id: id,
          status: "pending",
        },
        {
          $set: { status: "cancelled" },
        },
        {
          new: true,
          session,
        }
      );

      if (!updated) {
        throw httpError(
          "Este canje ya fue procesado",
          409
        );
      }

      // Devolver puntos al cliente
      const user = await User.findByIdAndUpdate(
        redemption.user,
        {
          $inc: {
            pointsBalance: redemption.pointsSpent,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!user) {
        throw httpError(
          "Usuario del canje no encontrado",
          404
        );
      }

      // Restaurar inventario
      const stockResult = await Reward.updateOne(
        { _id: reward._id },
        {
          $inc: { stock: 1 },
        },
        { session }
      );

      if (stockResult.matchedCount !== 1) {
        throw new Error(
          "No fue posible restaurar el inventario"
        );
      }

      // Registrar devolución en historial de puntos
      await PointsTransaction.create(
        [
          {
            user: redemption.user,
            type: "adjustment",
            points: redemption.pointsSpent,
            balanceAfter: user.pointsBalance,
            description:
              `Devolución por canje cancelado: ${reward.name}`,
            reference: redemption._id.toString(),
          },
        ],
        { session }
      );

      cancelledId = redemption._id;
    });

    const result = await Redemption.findById(
      cancelledId
    ).populate(
      "reward",
      "name restaurantName imageUrl"
    );

    return res.json({
      message:
        "Canje cancelado y puntos devueltos correctamente",
      redemption: result,
    });
  } catch (error) {
    console.error("Error cancelando canje:", error);

    return res.status(error.statusCode || 500).json({
      message:
        error.message || "Error al cancelar el canje",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
