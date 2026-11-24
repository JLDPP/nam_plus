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

export function readImageUpload(field, invalidMessage) {
  return (req, res, next) => {
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
        const body = JSON.parse(req.body[field]);
        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return res.status(400).json({ message: invalidMessage });
        }
        req.body = body;
      } catch {
        return res.status(400).json({
          message: invalidMessage,
        });
      }

      next();
    });
  };
}

export async function saveImage(file, directory, publicPath) {
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

  await mkdir(directory, { recursive: true });

  const filename = `${randomUUID()}.webp`;
  const destination = path.join(directory, filename);

  await writeFile(destination, bytes, { flag: "wx" });

  return {
    url: `${publicPath}/${filename}`,
    discard: () => unlink(destination),
  };
}

export function savePromotionImage(file) {
  return saveImage(file, imageDirectory, "/api/promotions/images");
}
