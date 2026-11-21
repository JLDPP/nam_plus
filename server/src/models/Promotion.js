import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Puntos que el cliente gana por comprar.
    points: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Puntos que se descuentan por canjear.
    pointsCost: {
      type: Number,
      default: 300,
      min: 1,
    },
    stock: {
      type: Number,
      default: 10,
      min: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

promotionSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.models.Promotion ||
  mongoose.model("Promotion", promotionSchema);