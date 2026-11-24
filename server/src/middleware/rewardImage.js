import { fileURLToPath } from "node:url";
import { saveImage } from "./promotionImage.js";

export const rewardImageDirectory = fileURLToPath(
  new URL("../uploads/recompensas/", import.meta.url)
);

export function saveRewardImage(file) {
  return saveImage(file, rewardImageDirectory, "/api/rewards/images");
}
