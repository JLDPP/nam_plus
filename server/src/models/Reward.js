
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    // Restaurante al que pertenece la recompensa
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      index: true,
    },

    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Puntos necesarios para canjear la recompensa
    pointsCost: {
      type: Number,
      required: true,
      min: 1,
    },

    // Cantidad disponible para canjes
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Permite activar o desactivar una recompensa
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index({
  active: 1,
  pointsCost: 1,
});

export default mongoose.models.Reward ||
  mongoose.model("Reward", rewardSchema);
