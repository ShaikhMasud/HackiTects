const mongoose = require("mongoose");

const dischargeSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
  },
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
  },
  scheduledDischargeTime: Date,
  actualDischargeTime: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Discharge", dischargeSchema);