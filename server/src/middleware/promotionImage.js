import multer from "multer";
import sharp from "sharp";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const imageDirectory = fileURLToPath(
  new URL("../uploads/promociones/", import.meta.url)
);

const receiveImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 1,
  },
}).single("image");

export function readPromotionUpload(req, res, next) {
  // Si el restaurante solo cambia el texto, la petición llega como JSON.
  if (!req.is("multipart/form-data")) {
    return next();
  }

  receiveImage(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: "La imagen debe pesar máximo 5 MB.",
        });
      }

      return res.status(400).json({
        message: "No se pudo recibir la imagen.",
      });
    }

    try {
      req.body = JSON.parse(req.body.promotion);
    } catch {
      return res.status(400).json({
        message: "Los datos de la promoción no son válidos.",
      });
    }

    next();
  });
}

export async function savePromotionImage(file) {
  if (!file) return null;

  const image = sharp(file.buffer, {
    limitInputPixels: 25_000_000,
  });

  let bytes;

  try {
    const { format } = await image.metadata();

    if (!["jpeg", "png", "webp"].includes(format)) {
      throw new Error("Formato no permitido");
    }

    bytes = await image.rotate().webp({ quality: 85 }).toBuffer();
  } catch {
    const error = new Error("Selecciona una imagen JPG, PNG o WebP válida.");
    error.status = 400;
    throw error;
  }

  await mkdir(imageDirectory, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  const destination = path.join(imageDirectory, filename);

  await writeFile(destination, bytes, { flag: "wx" });

  return {
    url: `/api/promotions/images/${filename}`,
    discard: () => unlink(destination),
  };
}