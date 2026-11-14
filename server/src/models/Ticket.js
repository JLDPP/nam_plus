
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    // No guardamos el código original en MongoDB.
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },

    // Importe expresado en centavos MXN
    amountCents: {
      type: Number,
      required: true,
      min: 0,
    },

    points: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["issued", "redeemed"],
      default: "issued",
      index: true,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({
  restaurant: 1,
  createdAt: -1,
});

export default mongoose.models.Ticket ||
  mongoose.model("Ticket", ticketSchema);
