const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },

    dob: Date,

    address: String,

    phone: String,

    state: String,

    zipCode: String,

    email: {
      type: String,
      trim: true
    },

    gender: String,

    userType: String,

    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent"
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ firstName: 1 });

module.exports = mongoose.model("User", userSchema);