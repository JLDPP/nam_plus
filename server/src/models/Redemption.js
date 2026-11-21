import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rewardModel: {
      type: String,
      enum: ["Reward", "Promotion"],
      default: "Reward",
    },

    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: function () {
        return this.rewardModel || "Reward";
      },
      required: true,
    },

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
  { timestamps: true }
);

redemptionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Redemption ||
  mongoose.model("Redemption", redemptionSchema);