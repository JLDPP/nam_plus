import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import PointsTransaction from "../models/PointsTransaction.js";

const profileFields = {
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
};
const password = z.string().min(6).refine((value) => Buffer.byteLength(value) <= 72);
const createFields = { ...profileFields, password };
const profileInput = z.strictObject(profileFields).partial();
const selfInput = profileInput.extend({
  currentPassword: z.string().min(1).optional(),
  newPassword: password.optional(),
}).refine((data) => Boolean(data.currentPassword) === Boolean(data.newPassword));
const managedInput = z.discriminatedUnion("role", [
  z.strictObject({ ...createFields, role: z.literal("cliente") }),
  z.strictObject({ ...createFields, role: z.literal("restaurante"), restaurantName: profileFields.name }),
]);
const adjustmentInput = z.strictObject({
  points: z.int().refine((value) => value !== 0),
  reason: z.string().trim().min(1).max(240),
});

export function publicAccount(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, pointsBalance: user.pointsBalance ?? 0 };
}

export function sessionFor(user) {
  const token = jwt.sign(
    { id: user.id, role: user.role, version: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { token, user: publicAccount(user) };
}

function safe(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ message: "Ese correo ya está registrado." });
      if (error instanceof z.ZodError) return res.status(400).json({
        message: "Revisa los datos. Usa un correo válido, una contraseña de al menos 6 caracteres y puntos enteros.",
      });
      console.error("Error en operación de cuenta:", error.name);
      return res.status(500).json({ message: "No se pudo completar la operación." });
    }
  };
}

export const registerAccount = safe(async (req, res) => {
  const { name, email, password: secret } = z.object(createFields).parse(req.body);
  const user = await User.create({ name, email, password: await bcrypt.hash(secret, 10), role: "cliente" });
  return res.status(201).json(sessionFor(user));
});

export const loginAccount = safe(async (req, res) => {
  const { email, password: secret } = z.object({
    email: profileFields.email,
    password: z.string().min(1),
  }).parse(req.body);
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(secret, user.password)) {
    return res.status(401).json({ message: "Correo o contraseña incorrectos." });
  }
  return res.json(sessionFor(user));
});

export function getOwnAccount(req, res) {
  return res.json(publicAccount(req.account));
}

export const updateOwnAccount = safe(async (req, res) => {
  const { currentPassword, newPassword, ...changes } = selfInput.parse(req.body);
  const conditions = { _id: req.userId };
  const update = { $set: changes };

  if (newPassword) {
    const account = await User.findById(req.userId).select("password tokenVersion");
    if (!account || (account.tokenVersion ?? 0) !== req.tokenVersion ||
        !await bcrypt.compare(currentPassword, account.password)) {
      return res.status(400).json({ message: "La contraseña actual es incorrecta." });
    }
    conditions.password = account.password;
    changes.password = await bcrypt.hash(newPassword, 10);
    update.$inc = { tokenVersion: 1 };
  }

  const user = await User.findOneAndUpdate(conditions, update, { new: true, runValidators: true });
  if (!user) return res.status(409).json({ message: "La cuenta cambió. Vuelve a intentarlo." });
  return res.json(newPassword ? sessionFor(user) : { user: publicAccount(user) });
});

export const listAccounts = safe(async (_req, res) => {
  const users = await User.find().select("name email role pointsBalance").sort({ name: 1, _id: 1 });
  return res.json(users.map(publicAccount));
});

export const createAccount = safe(async (req, res) => {
  const { password: secret, restaurantName, ...fields } = managedInput.parse(req.body);
  const data = { ...fields, password: await bcrypt.hash(secret, 10) };

  const user = fields.role === "restaurante"
    ? await mongoose.connection.transaction(async (session) => {
        const [owner] = await User.create([data], { session });
        await Restaurant.create([{ name: restaurantName, owner: owner.id }], { session });
        return owner;
      })
    : await User.create(data);
  return res.status(201).json(publicAccount(user));
});

export const updateAccount = safe(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: "Cuenta inválida." });
  }
  const changes = profileInput.parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: changes }, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: "Cuenta no encontrada." });
  return res.json(publicAccount(user));
});

export const adjustAccountPoints = safe(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isObjectIdOrHexString(id) || id.toLowerCase() === String(req.userId)) {
    return res.status(400).json({ message: "Selecciona otra cuenta para ajustar sus puntos." });
  }
  const { points, reason } = adjustmentInput.parse(req.body);
  const result = await mongoose.connection.transaction(async (session) => {
    const user = await User.findById(id).session(session);
    if (!user) return { status: 404, message: "Cuenta no encontrada." };

    const balance = (user.pointsBalance ?? 0) + points;
    if (!Number.isSafeInteger(balance) || balance < 0) {
      return { status: 409, message: "El ajuste dejaría un saldo inválido o negativo." };
    }
    user.pointsBalance = balance;
    await user.save({ session });
    await PointsTransaction.create([{
      user: user.id, type: "adjustment", points, balanceAfter: balance,
      description: reason, reference: String(req.userId),
    }], { session });
    return { user: publicAccount(user) };
  });

  if (result.status) return res.status(result.status).json({ message: result.message });
  return res.json(result.user);
});
