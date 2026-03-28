const mongoose = require("mongoose");

const escalationSchema = new mongoose.Schema({
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
  },
  type: {
    type: String,
    enum: [
      "discharge-delay",
      "cleaning-delay",
      "capacity-warning",
      "los-outlier",
    ],
  },
  severity: {
    type: String,
    enum: ["RED", "YELLOW", "BLUE"],
  },
  description: String,
  relatedPatientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    default: null,
  },
  relatedBedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bed",
    default: null,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Escalation", escalationSchema);