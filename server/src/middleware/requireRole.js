
import User from "../models/User.js";

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    // ==========================================
    // 1. VALIDAR AUTENTICACIÓN
    // ==========================================

    if (!req.userId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    try {
      // ==========================================
      // 2. CONSULTAR EL ROL ACTUAL EN MONGODB
      // ==========================================

      const user = await User.findById(req.userId)
        .select("role");

      if (!user) {
        return res.status(401).json({
          message: "Usuario no autenticado",
        });
      }

      // ==========================================
      // 3. VALIDAR PERMISOS
      // ==========================================

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "No tienes permisos para realizar esta acción",
        });
      }

      // ==========================================
      // 4. CONSERVAR EL ROL VALIDADO
      // ==========================================

      req.userRole = user.role;

      // ==========================================
      // 5. CONTINUAR CON LA RUTA ORIGINAL
      // ==========================================

      next();

    } catch (error) {
      console.error(
        "Error verificando permisos:",
        error
      );

      return res.status(500).json({
        message: "Error al verificar permisos",
      });
    }
  };
}
