/*
  ARCHIVO: admin.js

  FUNCIÓN:
  Permite continuar únicamente a usuarios
  que tengan el rol "admin".

  El middleware de autenticación guarda
  el ID del usuario en req.userId.
*/

import User from "../models/User.js";

export default async function adminOnly(
  req,
  res,
  next
) {
  try {
    const user = await User.findById(
      req.userId
    ).select("role");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        message:
          "Acceso exclusivo para administradores",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Error validando administrador:",
      error
    );

    return res.status(500).json({
      message:
        "Error al validar permisos de administrador",
    });
  }
}