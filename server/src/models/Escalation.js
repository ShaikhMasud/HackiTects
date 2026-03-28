const mongoose = require("mongoose");

const escalationSchema = new mongoose.Schema(
  {
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "discharge-delay",
        "cleaning-delay",
        "capacity-warning",
        "los-outlier",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["RED", "YELLOW", "BLUE"],
    },
    description: String,
    relatedPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    relatedBedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Escalation", escalationSchema);
