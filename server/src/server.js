import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import promotionRoutes from "./routes/promotion.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    message: "Servidor de Ñam+ funcionando correctamente",
  });
});

// Login y Register
app.use("/api/auth", authRoutes);

// Promociones
app.use("/api/promotions", promotionRoutes);

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI, {
    dbName: "BackPWA",
  })
  .then(() => {
    console.log("MongoDB conectado correctamente");

    app.listen(PORT, () => {
      console.log(
        `Servidor corriendo en http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "Error al conectar a MongoDB:",
      error
    );
  });