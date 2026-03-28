const mongoose = require("mongoose");

const dischargeSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
      index: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
    },
    scheduledDischargeTime: Date,
    actualDischargeTime: Date,
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    delayInMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Discharge", dischargeSchema);
