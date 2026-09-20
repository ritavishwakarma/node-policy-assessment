const mongoose = require("mongoose");

const scheduledPostSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ScheduledPost",
  scheduledPostSchema
);