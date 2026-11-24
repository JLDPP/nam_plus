import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

export async function auth(req, res, next) {
  res.set("Cache-Control", "no-store");
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Token requerido" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ message: "Error de configuración del servidor" });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }
  if (!mongoose.isObjectIdOrHexString(payload.id)) return res.status(401).json({ message: "Token inválido" });

  try {
    const account = await User.findById(payload.id).select("name email role pointsBalance tokenVersion");
    if (!account || (payload.version ?? 0) !== (account.tokenVersion ?? 0)) {
      return res.status(401).json({ message: "Sesión expirada" });
    }

    req.account = account;
    req.userId = account.id;
    req.userRole = account.role;
    req.tokenVersion = account.tokenVersion ?? 0;
    return next();
  } catch (error) {
    return next(error);
  }
}
