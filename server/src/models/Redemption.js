
import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: true,
    },

    // Cantidad de puntos utilizados en el canje.
    pointsSpent: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

redemptionSchema.index({
  user: 1,
  createdAt: -1,
});

export default mongoose.models.Redemption ||
  mongoose.model("Redemption", redemptionSchema);
