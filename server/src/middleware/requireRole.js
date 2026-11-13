
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({
        message: "Usuario no autenticado",
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: "No tienes permisos para realizar esta acción",
      });
    }

    next();
  };
}
