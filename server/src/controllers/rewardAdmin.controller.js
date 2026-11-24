
import mongoose from "mongoose";

import Reward from "../models/Reward.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";
import { saveRewardImage } from "../middleware/rewardImage.js";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

async function getAuthorizedUser(userId) {
  const user = await User.findById(userId).select("role");

  if (!user || !["restaurante", "admin"].includes(user.role)) {
    const error = new Error(
      "No tienes permisos para administrar recompensas"
    );
    error.statusCode = 403;
    throw error;
  }

  return user;
}

function sendError(res, error) {
  console.error("Error administrando recompensas:", error);

  const status = error.statusCode || error.status || 500;
  return res.status(status).json({
    message:
      status < 500
        ? error.message
        : "Error interno al administrar recompensas",
  });
}

async function discardFailedImage(image) {
  if (image) {
    await image.discard().catch((error) => {
      console.error("Error limpiando imagen de recompensa:", error);
    });
  }
}

function validateRewardFields(data, creating = false) {
  const allowed = [
    "name",
    "description",
    "imageUrl",
    "pointsCost",
    "stock",
    "active",
  ];

  const cleaned = {};

  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      const error = new Error(
        `El campo ${key} no se puede modificar`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (creating || data.name !== undefined) {
    if (
      typeof data.name !== "string" ||
      !data.name.trim()
    ) {
      const error = new Error(
        "El nombre de la recompensa es obligatorio"
      );
      error.statusCode = 400;
      throw error;
    }

    cleaned.name = data.name.trim();
  }

  for (const field of ["description", "imageUrl"]) {
    if (data[field] !== undefined) {
      if (typeof data[field] !== "string") {
        const error = new Error(
          `${field} debe ser un texto`
        );
        error.statusCode = 400;
        throw error;
      }

      cleaned[field] = data[field].trim();
    }
  }

  if (cleaned.imageUrl) {
    try {
      const url = new URL(cleaned.imageUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Protocolo no permitido");
      }
    } catch {
      const error = new Error(
        "La imagen debe tener una URL HTTP o HTTPS válida"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  if (creating || data.pointsCost !== undefined) {
    if (
      !Number.isSafeInteger(data.pointsCost) ||
      data.pointsCost < 1
    ) {
      const error = new Error(
        "El costo debe ser un número entero mayor a cero"
      );
      error.statusCode = 400;
      throw error;
    }

    cleaned.pointsCost = data.pointsCost;
  }

  if (creating || data.stock !== undefined) {
    const stock = data.stock ?? (creating ? 0 : undefined);

    if (!Number.isSafeInteger(stock) || stock < 0) {
      const error = new Error(
        "El inventario debe ser un número entero no negativo"
      );
      error.statusCode = 400;
      throw error;
    }

    cleaned.stock = stock;
  }

  if (data.active !== undefined) {
    if (typeof data.active !== "boolean") {
      const error = new Error(
        "El estado activo debe ser verdadero o falso"
      );
      error.statusCode = 400;
      throw error;
    }

    cleaned.active = data.active;
  }

  return cleaned;
}

// ==========================================
// VERIFICAR PROPIEDAD DE RECOMPENSA
// ==========================================

async function getEditableReward(rewardId, user) {
  if (!mongoose.isValidObjectId(rewardId)) {
    const error = new Error("ID de recompensa inválido");
    error.statusCode = 400;
    throw error;
  }

  const reward = await Reward.findById(rewardId);

  if (!reward) {
    const error = new Error("Recompensa no encontrada");
    error.statusCode = 404;
    throw error;
  }

  // El administrador puede gestionar cualquier recompensa.
  if (user.role === "admin") {
    return reward;
  }

  // El restaurante solamente puede gestionar las suyas.
  const restaurant = await Restaurant.findOne({
    _id: reward.restaurant,
    owner: user._id,
    active: true,
  });

  if (!restaurant) {
    const error = new Error(
      "No puedes administrar recompensas de otro restaurante"
    );
    error.statusCode = 403;
    throw error;
  }

  return reward;
}

// ==========================================
// 1. CONSULTAR RECOMPENSAS ADMINISTRABLES
// ==========================================

export async function getManagedRewards(req, res) {
  try {
    const user = await getAuthorizedUser(req.userId);

    let filter = {};

    if (user.role === "restaurante") {
      const restaurants = await Restaurant.find({
        owner: user._id,
        active: true,
      }).select("_id");

      const ids = restaurants.map((r) => r._id);

      filter = {
        restaurant: { $in: ids },
      };
    }

    const rewards = await Reward.find(filter)
      .populate("restaurant", "name active")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(rewards);
  } catch (error) {
    return sendError(res, error);
  }
}

// ==========================================
// 2. CREAR RECOMPENSA
// ==========================================

export async function createManagedReward(req, res) {
  let image;
  try {
    const user = await getAuthorizedUser(req.userId);

    const { restaurantId, ...fields } = req.body || {};

    const data = validateRewardFields(fields, true);

    let restaurant;

    if (user.role === "admin") {
      if (!mongoose.isValidObjectId(restaurantId)) {
        return res.status(400).json({
          message: "Selecciona un restaurante válido",
        });
      }

      restaurant = await Restaurant.findOne({
        _id: restaurantId,
        active: true,
      });
    } else {
      // El restaurante no puede elegir otro propietario.
      if (restaurantId !== undefined) {
        return res.status(400).json({
          message:
            "La cuenta restaurante no debe enviar restaurantId",
        });
      }

      restaurant = await Restaurant.findOne({
        owner: user._id,
        active: true,
      });
    }

    if (!restaurant) {
      return res.status(404).json({
        message: "No se encontró un restaurante activo",
      });
    }

    image = await saveRewardImage(req.file);
    const reward = await Reward.create({
      ...data,
      ...(image ? { imageUrl: image.url } : {}),
      restaurant: restaurant._id,
      restaurantName: restaurant.name,
      active: data.active ?? true,
    });

    image = null;
    return res.status(201).json({
      message: "Recompensa creada correctamente",
      reward,
    });
  } catch (error) {
    await discardFailedImage(image);
    return sendError(res, error);
  }
}

// ==========================================
// 3. ACTUALIZAR RECOMPENSA
// ==========================================

export async function updateManagedReward(req, res) {
  let image;
  try {
    const user = await getAuthorizedUser(req.userId);

    const reward = await getEditableReward(
      req.params.id,
      user
    );

    const fields = req.body || {};
    const data = validateRewardFields(fields);

    if (Object.keys(data).length === 0 && !req.file) {
      return res.status(400).json({
        message: "No se enviaron cambios válidos",
      });
    }

    image = await saveRewardImage(req.file);
    Object.assign(reward, data);
    if (image) reward.imageUrl = image.url;

    await reward.save();
    image = null;

    return res.json({
      message: "Recompensa actualizada correctamente",
      reward,
    });
  } catch (error) {
    await discardFailedImage(image);
    return sendError(res, error);
  }
}

// ==========================================
// 4. DESACTIVAR RECOMPENSA
// ==========================================

export async function deactivateManagedReward(req, res) {
  try {
    const user = await getAuthorizedUser(req.userId);

    const reward = await getEditableReward(
      req.params.id,
      user
    );

    reward.active = false;

    await reward.save();

    return res.json({
      message: "Recompensa desactivada correctamente",
      reward,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
