const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["pending", "arrived"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["emergency", "urgent", "routine"],
      default: "routine",
    },
    arrivedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Admission", admissionSchema);