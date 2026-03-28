const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
    required: true,
    index: true,
  },
  bedNumber: Number,
  status: {
    type: String,
    enum: ["available", "occupied", "cleaning", "reserved"],
    default: "available",
  },
  occupantPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  lastUpdated: { type: Date, default: Date.now },
  inChargeDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  cleaningStartTime: Date,
});

module.exports = mongoose.model("Bed", bedSchema);
