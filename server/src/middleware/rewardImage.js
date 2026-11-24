import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import RewardImage, { maxRewardImageBytes } from "../models/RewardImage.js";
import { encodeImage } from "./promotionImage.js";

export const rewardImageDirectory = fileURLToPath(
  new URL("../uploads/recompensas/", import.meta.url)
);

export const rewardImagePrefix = "/api/rewards/images/";
export const rewardImageFilename = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export async function saveRewardImage(file) {
  if (!file) return null;

  const bytes = await encodeImage(file);
  if (bytes.length > maxRewardImageBytes) {
    const error = new Error("La imagen procesada es demasiado grande. Elige una imagen de menor resolución.");
    error.status = 413;
    throw error;
  }

  const filename = `${randomUUID()}.webp`;
  await RewardImage.create({ _id: filename, bytes });

  return {
    url: rewardImagePrefix + filename,
    discard: () => RewardImage.deleteOne({ _id: filename }),
  };
}

export async function getRewardImage(req, res, next) {
  const { filename } = req.params;
  if (!rewardImageFilename.test(filename)) return next();

  const image = await RewardImage.findById(filename);
  if (!image) return next();

  return res
    .type("image/webp")
    .set("Cache-Control", "public, max-age=31536000, immutable")
    .send(image.bytes);
}
