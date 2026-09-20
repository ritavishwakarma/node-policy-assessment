const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    policyStartDate: Date,

    policyEndDate: Date,

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lob"
    },

    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

policySchema.index({ userId: 1 });
policySchema.index({ categoryId: 1 });
policySchema.index({ carrierId: 1 });

module.exports = mongoose.model("Policy", policySchema);