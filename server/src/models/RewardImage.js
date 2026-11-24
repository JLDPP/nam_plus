import mongoose from "mongoose";

export const maxRewardImageBytes = 15 * 1024 * 1024;

const rewardImageSchema = new mongoose.Schema({
  _id: String,
  bytes: {
    type: Buffer,
    required: true,
    validate: (bytes) => bytes.length > 0 && bytes.length <= maxRewardImageBytes,
  },
}, {
  versionKey: false,
});

export default mongoose.model("RewardImage", rewardImageSchema);
