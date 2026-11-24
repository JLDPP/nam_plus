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
