export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.account) return res.status(401).json({ message: "Usuario no autenticado" });
    if (!allowedRoles.includes(req.account.role)) {
      return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    return next();
  };
}
