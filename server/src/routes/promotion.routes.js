import express, { Router } from "express";
import { imageDirectory } from "../middleware/promotionImage.js";

const router = Router();

// Las imágenes siguen disponibles para los canjes históricos.
router.use("/images", express.static(imageDirectory, { index: false }));

export default router;
