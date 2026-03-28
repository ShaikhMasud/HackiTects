const mongoose = require("mongoose");

const bedSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
    required: true,
  },
  bedNumber: {
    type: Number,
    required: true,
  },
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
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  cleaningStartTime: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Bed", bedSchema);