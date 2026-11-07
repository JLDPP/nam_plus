
import Reward from "../models/Reward.js";

// Obtener recompensas activas
export async function getRewards(req, res) {
  try {
    const rewards = await Reward.find({
      active: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(rewards);
  } catch (error) {
    console.error("Error consultando recompensas:", error);

    return res.status(500).json({
      message: "Error al consultar las recompensas",
    });
  }
}
