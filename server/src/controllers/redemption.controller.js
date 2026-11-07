
import mongoose from "mongoose";

import User from "../models/User.js";
import Reward from "../models/Reward.js";
import Redemption from "../models/Redemption.js";
import PointsTransaction from "../models/PointsTransaction.js";

// Realizar un canje
export async function createRedemption(req, res) {
  const { rewardId } = req.body;

  if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
    return res.status(400).json({
      message: "La recompensa seleccionada no es válida",
    });
  }

  const session = await mongoose.startSession();

  try {
    let createdRedemption = null;

    await session.withTransaction(async () => {
      // Buscar la recompensa
      const reward = await Reward.findOne({
        _id: rewardId,
        active: true,
      }).session(session);

      if (!reward) {
        const error = new Error(
          "La recompensa no existe o está desactivada"
        );
        error.statusCode = 404;
        throw error;
      }

      if (reward.stock <= 0) {
        const error = new Error(
          "Esta recompensa se encuentra agotada"
        );
        error.statusCode = 400;
        throw error;
      }

      // Inicializar puntos para usuarios antiguos
      // que todavía no tengan pointsBalance.
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

      // Consultar y descontar puntos de forma atómica
      const user = await User.findOneAndUpdate(
        {
          _id: req.userId,
          pointsBalance: {
            $gte: reward.pointsCost,
          },
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
        const error = new Error(
          "No tienes suficientes puntos para realizar este canje"
        );
        error.statusCode = 400;
        throw error;
      }

      // Descontar una unidad de inventario
      const updatedReward = await Reward.findOneAndUpdate(
        {
          _id: rewardId,
          active: true,
          stock: { $gt: 0 },
        },
        {
          $inc: {
            stock: -1,
          },
        },
        {
          new: true,
          session,
        }
      );

      if (!updatedReward) {
        const error = new Error(
          "La recompensa acaba de agotarse. Inténtalo nuevamente."
        );
        error.statusCode = 409;
        throw error;
      }

      // Crear registro del canje
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

      // Registrar el movimiento de puntos
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

    // Devolver el canje con los datos de la recompensa
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
      message:
        error.message || "Error al realizar el canje",
    });
  } finally {
    await session.endSession();
  }
}

// Consultar historial de canjes del usuario
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
    console.error("Error consultando historial de canjes:", error);

    return res.status(500).json({
      message: "Error al consultar el historial de canjes",
    });
  }
}
