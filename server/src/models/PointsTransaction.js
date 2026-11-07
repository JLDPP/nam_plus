
import mongoose from "mongoose";

const pointsTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["earn", "redeem", "adjustment"],
      required: true,
    },

    // Cantidad de puntos del movimiento.
    // En earn y redeem debe ser positiva.
    // En adjustment puede ser positiva o negativa.
    points: {
      type: Number,
      required: true,
      validate: {
        validator: function (value) {
          if (this.type === "adjustment") {
            return value !== 0;
          }

          return value > 0;
        },
        message: "La cantidad de puntos no es válida.",
      },
    },

    // Saldo que tenía el usuario después del movimiento.
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    reference: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

pointsTransactionSchema.index({
  user: 1,
  createdAt: -1,
});

export default mongoose.models.PointsTransaction ||
  mongoose.model(
    "PointsTransaction",
    pointsTransactionSchema
  );
