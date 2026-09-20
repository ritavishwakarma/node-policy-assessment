const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true
    },

    scheduledPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScheduledPost",
      unique: true,
      sparse: true
    },

    postedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);