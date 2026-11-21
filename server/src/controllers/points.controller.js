import mongoose from "mongoose";
import User from "../models/User.js";
import PointsTransaction from "../models/PointsTransaction.js";

// CONSULTAR SALDO
export async function getBalance(req, res) {
  try {
    const user = await User.findById(req.userId)
      .select("pointsBalance");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.json({
      pointsBalance: user.pointsBalance ?? 0,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error al consultar el saldo",
    });
  }
}

// CONSULTAR HISTORIAL
export async function getHistory(req, res) {
  try {
    const transactions = await PointsTransaction.find({
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(transactions);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error al consultar el historial",
    });
  }
}

// BUSCAR CLIENTE
export async function findCustomer(req, res) {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Ingresa un correo electrónico válido",
      });
    }

    const customer = await User.findOne({
      email,
      role: "cliente",
    }).select("_id name email");

    if (!customer) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    return res.json({ customer });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Error al buscar al cliente",
    });
  }
}

// TRANSFERIR PUNTOS
export async function transferPoints(req, res) {
  const { customerId, points } = req.body ?? {};

  if (
    typeof customerId !== "string" ||
    !mongoose.isValidObjectId(customerId)
  ) {
    return res.status(400).json({
      message: "Cliente inválido",
    });
  }

  if (
    !Number.isSafeInteger(points) ||
    points < 1 ||
    points > 10000
  ) {
    return res.status(400).json({
      message: "Ingresa entre 1 y 10000 puntos",
    });
  }

  let session;

  try {
    session = await mongoose.startSession();

    let result;

    await session.withTransaction(async () => {
      const restaurant = await User.findOne({
        _id: req.userId,
        role: "restaurante",
      })
        .select("name")
        .session(session);

      if (!restaurant) {
        const error = new Error("Restaurante no autorizado");
        error.status = 403;
        throw error;
      }

      const customer = await User.findOneAndUpdate(
        {
          _id: customerId,
          role: "cliente",
        },
        {
          $inc: { pointsBalance: points },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      ).select("name email pointsBalance");

      if (!customer) {
        const error = new Error("Cliente no encontrado");
        error.status = 404;
        throw error;
      }

      const [transaction] = await PointsTransaction.create(
        [
          {
            user: customer._id,
            type: "earn",
            points,
            balanceAfter: customer.pointsBalance,
            description:
              `Puntos otorgados por ${restaurant.name}`,
            reference: `restaurant:${restaurant._id}`,
          },
        ],
        { session }
      );

      result = {
        message: "Puntos transferidos correctamente",
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          pointsBalance: customer.pointsBalance,
        },
        pointsTransferred: points,
        transactionId: transaction._id,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error transfiriendo puntos:", error);

    return res.status(error.status || 500).json({
      message: error.status
        ? error.message
        : "Error al transferir puntos",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}