/*
  ARCHIVO: Promotion.js

  FUNCIÓN:
  Define la estructura de una promoción en MongoDB.
*/

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

    points: {
      type: Number,
      default: 0,
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
  }
);

export default mongoose.model(
  "Promotion",
  promotionSchema
);