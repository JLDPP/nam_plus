
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function register(req, res) {
  try {
    const { name, email, password, role = "cliente" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Nombre, correo y contraseña son requeridos",
      });
    }

    const emailNormalized = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: emailNormalized,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Ese correo ya está registrado",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 6 caracteres",
      });
    }

    // Se conserva la validación de roles.
    // Los registros públicos se crean como clientes para evitar
    // que alguien se asigne permisos de administrador o restaurante.
    const allowedRoles = ["cliente", "restaurante", "admin"];

    const safeRole = allowedRoles.includes(role)
      ? role
      : "cliente";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: emailNormalized,
      password: hashedPassword,

      // Seguridad: el registro público siempre crea clientes.
      role: "cliente",

      // Nuevo: saldo inicial de puntos.
      pointsBalance: 0,
    });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      message: "Usuario registrado correctamente",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Nuevo: saldo de puntos del usuario.
        pointsBalance: user.pointsBalance || 0,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);

    return res.status(500).json({
      message: "Error en el servidor",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Correo y contraseña son requeridos",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        message: "Correo o contraseña incorrectos",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Nuevo: devuelve los puntos al iniciar sesión.
        pointsBalance: user.pointsBalance || 0,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);

    return res.status(500).json({
      message: "Error en el servidor",
    });
  }
}
