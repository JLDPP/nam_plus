
import User from "../models/User.js";
import PointsTransaction from "../models/PointsTransaction.js";

// Consultar saldo de puntos
export async function getBalance(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      "pointsBalance"
    );

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    return res.json({
      pointsBalance: user.pointsBalance ?? 0,
    });
  } catch (error) {
    console.error("Error consultando puntos:", error);

    return res.status(500).json({
      message: "Error al consultar el saldo de puntos",
    });
  }
}

// Consultar movimientos de puntos
export async function getHistory(req, res) {
  try {
    const transactions = await PointsTransaction.find({
      user: req.userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(transactions);
  } catch (error) {
    console.error("Error consultando movimientos:", error);

    return res.status(500).json({
      message: "Error al consultar el historial de puntos",
    });
  }
}
