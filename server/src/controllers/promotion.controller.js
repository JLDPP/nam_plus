/*
  ARCHIVO: promotion.controller.js

  FUNCIÓN:
  Contiene la lógica del CRUD de promociones.

  ESTADOS AUTOMÁTICOS:
  - Programada: aún no llega la fecha de inicio.
  - Activa: está dentro de su periodo de vigencia.
  - Vencida: ya pasó la fecha límite.
  - Inactiva: active está en false.
*/

import Promotion from "../models/Promotion.js";

/*
  Calcula automáticamente el estado
  actual de una promoción.
*/
function getPromotionStatus(promotion) {
  const now = new Date();

  if (!promotion.active) {
    return "Inactiva";
  }

  if (
    promotion.startDate &&
    new Date(promotion.startDate) > now
  ) {
    return "Programada";
  }

  if (
    promotion.endDate &&
    new Date(promotion.endDate) < now
  ) {
    return "Vencida";
  }

  return "Activa";
}

/*
  Agrega el estado calculado al objeto
  que se envía al frontend.
*/
function promotionWithStatus(promotion) {
  const data = promotion.toObject();

  return {
    ...data,
    status: getPromotionStatus(promotion),
  };
}

export async function getPromotions(req, res) {
  try {
    const promotions =
      await Promotion.find()
        .sort({
          createdAt: -1,
        });

    const promotionsWithStatus =
      promotions.map(
        (promotion) =>
          promotionWithStatus(
            promotion
          )
      );

    return res
      .status(200)
      .json(
        promotionsWithStatus
      );
  } catch (error) {
    console.error(
      "Error obteniendo promociones:",
      error
    );

    return res.status(500).json({
      message:
        "Error al obtener promociones",
    });
  }
}

export async function getPromotionById(
  req,
  res
) {
  try {
    const promotion =
      await Promotion.findById(
        req.params.id
      );

    if (!promotion) {
      return res
        .status(404)
        .json({
          message:
            "Promoción no encontrada",
        });
    }

    return res
      .status(200)
      .json(
        promotionWithStatus(
          promotion
        )
      );
  } catch (error) {
    console.error(
      "Error obteniendo promoción:",
      error
    );

    return res.status(500).json({
      message:
        "Error al obtener la promoción",
    });
  }
}

export async function createPromotion(
  req,
  res
) {
  try {
    const {
      title,
      description,
      restaurantName,
      imageUrl,
      minAmount,
      points,
      active,
      startDate,
      endDate,
    } = req.body;

    if (
      !title ||
      !restaurantName
    ) {
      return res
        .status(400)
        .json({
          message:
            "El título y el restaurante son obligatorios",
        });
    }

    if (
      startDate &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      return res
        .status(400)
        .json({
          message:
            "La fecha límite no puede ser anterior a la fecha de inicio",
        });
    }

    const promotion =
      await Promotion.create({
        title,
        description,
        restaurantName,
        imageUrl,
        minAmount,
        points,
        active,
        startDate,
        endDate,
      });

    return res
      .status(201)
      .json(
        promotionWithStatus(
          promotion
        )
      );
  } catch (error) {
    console.error(
      "Error creando promoción:",
      error
    );

    return res.status(500).json({
      message:
        "Error al crear la promoción",
    });
  }
}

export async function updatePromotion(
  req,
  res
) {
  try {
    const {
      startDate,
      endDate,
    } = req.body;

    if (
      startDate &&
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      return res
        .status(400)
        .json({
          message:
            "La fecha límite no puede ser anterior a la fecha de inicio",
        });
    }

    const promotion =
      await Promotion.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!promotion) {
      return res
        .status(404)
        .json({
          message:
            "Promoción no encontrada",
        });
    }

    return res
      .status(200)
      .json(
        promotionWithStatus(
          promotion
        )
      );
  } catch (error) {
    console.error(
      "Error actualizando promoción:",
      error
    );

    return res.status(500).json({
      message:
        "Error al actualizar la promoción",
    });
  }
}

export async function deletePromotion(
  req,
  res
) {
  try {
    const promotion =
      await Promotion.findByIdAndDelete(
        req.params.id
      );

    if (!promotion) {
      return res
        .status(404)
        .json({
          message:
            "Promoción no encontrada",
        });
    }

    return res
      .status(200)
      .json({
        message:
          "Promoción eliminada correctamente",
      });
  } catch (error) {
    console.error(
      "Error eliminando promoción:",
      error
    );

    return res.status(500).json({
      message:
        "Error al eliminar la promoción",
    });
  }
}