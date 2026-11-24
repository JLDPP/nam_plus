import "dotenv/config";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import Reward from "../src/models/Reward.js";
import RewardImage, { maxRewardImageBytes } from "../src/models/RewardImage.js";
import {
  rewardImageDirectory,
  rewardImageFilename,
  rewardImagePrefix,
} from "../src/middleware/rewardImage.js";

async function migrate() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Configura MONGODB_URI en el .env de server.");
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: "BackPWA" });

  const urls = await Reward.distinct("imageUrl", {
    imageUrl: /^\/api\/rewards\/images\//,
  });
  let copied = 0;
  let existing = 0;
  let failed = 0;

  for (const url of urls) {
    const filename = url.slice(rewardImagePrefix.length);
    try {
      if (!rewardImageFilename.test(filename)) throw new Error("Nombre de archivo inválido.");

      if (await RewardImage.exists({ _id: filename })) {
        existing++;
        continue;
      }

      const file = path.join(rewardImageDirectory, filename);
      const { size } = await stat(file);
      if (size === 0 || size > maxRewardImageBytes) {
        throw new Error("El tamaño del archivo está fuera del límite admitido.");
      }

      const bytes = await readFile(file);
      if (bytes.length !== size) throw new Error("El archivo cambió durante la copia.");
      const result = await RewardImage.updateOne(
        { _id: filename },
        { $setOnInsert: { bytes } },
        { upsert: true }
      );
      if (result.upsertedCount) copied++;
      else existing++;
    } catch (error) {
      failed++;
      console.error(`No se pudo trasladar ${filename}: ${error.message}`);
    }
  }

  console.log(`Copiadas: ${copied}. Ya en MongoDB: ${existing}. Con error: ${failed}.`);
  if (failed) process.exitCode = 1;
}

try {
  await migrate();
} catch (error) {
  console.error("No se pudo completar la migración:", error.name);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
