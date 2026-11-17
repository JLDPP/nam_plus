
import mongoose from "mongoose";

import Promotion from "../models/Promotion.js";
import Restaurant from "../models/Restaurant.js";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function getPromotionStatus(promotion) {
  const now = new Date();

  if (!promotion.active) {
    return "Inactiva";
  }

  if (promotion.startDate && promotion.startDate > now) {
    return "Programada";
  }

  if (promotion.endDate && promotion.endDate < now) {
    return "Vencida";
  }

  return "Activa";
}

function promotionWithStatus(promotion) {
  return {
    ...promotion.toObject(),
    status: getPromotionStatus(promotion),
  };
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function validId(id) {
  return mongoose.isObjectIdOrHexString(id);
}

function handleError(res, error) {
  if (error.status === 400) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      message: "Los datos de la promoción no son válidos",
    });
  }

  if (error.name === "VersionError") {
    return res.status(409).json({
      message:
        "La promoción fue modificada. Actualiza la página e inténtalo nuevamente.",
    });
  }

  console.error("Error en promociones:", error);

  return res.status(500).json({
    message: "Error al procesar la promoción",
  });
}

// ==========================================
// VALIDAR FECHAS
// ==========================================

function parseDate(value, field) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    badRequest(`${field} no es válida`);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    badRequest(`${field} no es válida`);
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    date.toISOString().slice(0, 10) !== value
  ) {
    badRequest(`${field} no es válida`);
  }

  return date;
}

// ==========================================
// VALIDAR CAMPOS DE PROMOCIÓN
// ==========================================

function getPromotionData(
  body,
  current = null,
  restaurantName = undefined
) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    badRequest("Datos inválidos");
  }

  const data = {};

  // Solo se aceptan los campos permitidos.
  const textFields = [
    "title",
    "description",
    "imageUrl",
  ];

  for (const field of textFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string") {
        badRequest(`El campo ${field} no es válido`);
      }

      data[field] = body[field].trim();
    }
  }

  const title = data.title ?? current?.title;

  if (!title || !title.trim()) {
    badRequest("El título es obligatorio");
  }

  // Para restaurantes, el nombre siempre proviene
  // del documento autorizado en MongoDB.
  if (restaurantName !== undefined) {
    data.restaurantName = restaurantName;
  } else if (body.restaurantName !== undefined) {
    if (typeof body.restaurantName !== "string") {
      badRequest("El nombre del restaurante no es válido");
    }

    data.restaurantName = body.restaurantName.trim();
  }

  const finalRestaurantName =
    data.restaurantName ?? current?.restaurantName;

  if (!finalRestaurantName) {
    badRequest("El restaurante es obligatorio");
  }

  // Validar importes y puntos.
  for (const field of ["minAmount", "points"]) {
    if (body[field] !== undefined) {
      const value = body[field];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0
      ) {
        badRequest(`El campo ${field} no es válido`);
      }

      if (
        field === "points" &&
        !Number.isSafeInteger(value)
      ) {
        badRequest("Los puntos deben ser números enteros");
      }

      data[field] = value;
    }
  }

  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") {
      badRequest("El estado no es válido");
    }

    data.active = body.active;
  }

  if (body.startDate !== undefined) {
    data.startDate = parseDate(
      body.startDate,
      "La fecha de inicio"
    );
  }

  if (body.endDate !== undefined) {
    data.endDate =
      body.endDate === null
        ? null
        : parseDate(
            body.endDate,
            "La fecha límite"
          );
  }

  // Validar fechas incluso en actualizaciones parciales.
  const start =
    data.startDate ??
    current?.startDate ??
    new Date();

  const end =
    data.endDate !== undefined
      ? data.endDate
      : current?.endDate ?? null;

  if (end && end < start) {
    badRequest(
      "La fecha límite no puede ser anterior a la fecha de inicio"
    );
  }

  return data;
}

// ==========================================
// CONSULTAR TODAS LAS PROMOCIONES
// CONSERVA EL COMPORTAMIENTO EXISTENTE
// ==========================================

export async function getPromotions(req, res) {
  try {
    const promotions = await Promotion.find()
      .sort({ createdAt: -1 });

    return res.status(200).json(
      promotions.map(promotionWithStatus)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// CONSULTAR PROMOCIÓN POR ID
// ==========================================

export async function getPromotionById(req, res) {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    const promotion = await Promotion.findById(
      req.params.id
    );

    if (!promotion) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    return res.status(200).json(
      promotionWithStatus(promotion)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// CREAR PROMOCIÓN - ADMIN
// ==========================================

export async function createPromotion(req, res) {
  try {
    const data = getPromotionData(req.body);

    const promotion = await Promotion.create(data);

    return res.status(201).json(
      promotionWithStatus(promotion)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// ACTUALIZAR PROMOCIÓN - ADMIN
// ==========================================

export async function updatePromotion(req, res) {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    const promotion = await Promotion.findById(
      req.params.id
    );

    if (!promotion) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    const data = getPromotionData(
      req.body,
      promotion,
      promotion.restaurant
        ? promotion.restaurantName
        : undefined
    );

    promotion.set(data);

    await promotion.save();

    return res.status(200).json(
      promotionWithStatus(promotion)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// ELIMINAR PROMOCIÓN - ADMIN
// ==========================================

export async function deletePromotion(req, res) {
  try {
    if (!validId(req.params.id)) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    const promotion = await Promotion.findById(
      req.params.id
    );

    if (!promotion) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    // Las publicaciones vinculadas a restaurantes
    // deben conservarse en su historial.
    if (promotion.restaurant) {
      return res.status(409).json({
        message:
          "Esta promoción pertenece a un restaurante. Desactívala en lugar de eliminarla.",
      });
    }

    await Promotion.deleteOne({
      _id: promotion._id,
      restaurant: null,
    });

    return res.status(200).json({
      message: "Promoción eliminada correctamente",
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// RESTAURANTES DEL USUARIO Y SUS PROMOCIONES
// ==========================================

export async function getMyPromotions(req, res) {
  try {
    const restaurants = await Restaurant.find({
      owner: req.userId,
      active: true,
    })
      .select("_id name")
      .sort({ name: 1 });

    const restaurantIds = restaurants.map(
      (restaurant) => restaurant._id
    );

    const promotions = await Promotion.find({
      restaurant: { $in: restaurantIds },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      restaurants,
      promotions: promotions.map(
        promotionWithStatus
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// COMPROBAR PROPIETARIO DEL RESTAURANTE
// ==========================================

async function findOwnedRestaurant(req) {
  const { restaurantId } = req.params;

  if (!validId(restaurantId)) {
    return null;
  }

  return Restaurant.findOne({
    _id: restaurantId,
    owner: req.userId,
    active: true,
  });
}

// ==========================================
// PUBLICAR PROMOCIÓN - RESTAURANTE
// ==========================================

export async function createRestaurantPromotion(
  req,
  res
) {
  try {
    const restaurant =
      await findOwnedRestaurant(req);

    if (!restaurant) {
      return res.status(404).json({
        message:
          "Restaurante no encontrado o no autorizado",
      });
    }

    const data = getPromotionData(
      req.body,
      null,
      restaurant.name
    );

    const promotion = await Promotion.create({
      ...data,
      restaurant: restaurant._id,
      restaurantName: restaurant.name,
    });

    return res.status(201).json(
      promotionWithStatus(promotion)
    );
  } catch (error) {
    return handleError(res, error);
  }
}

// ==========================================
// EDITAR O DESACTIVAR - RESTAURANTE
// ==========================================

export async function updateRestaurantPromotion(
  req,
  res
) {
  try {
    const restaurant =
      await findOwnedRestaurant(req);

    if (!restaurant) {
      return res.status(404).json({
        message:
          "Restaurante no encontrado o no autorizado",
      });
    }

    if (!validId(req.params.id)) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    // Solo se consulta una promoción del negocio.
    const promotion = await Promotion.findOne({
      _id: req.params.id,
      restaurant: restaurant._id,
    });

    if (!promotion) {
      return res.status(404).json({
        message: "Promoción no encontrada",
      });
    }

    const data = getPromotionData(
      req.body,
      promotion,
      restaurant.name
    );

    promotion.set(data);

    await promotion.save();

    return res.status(200).json(
      promotionWithStatus(promotion)
    );
  } catch (error) {
    return handleError(res, error);
  }
}
