const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    wardName: { type: String, required: true },
    totalBeds: { type: Number, default: 40 },
    specialization: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ward", wardSchema);
