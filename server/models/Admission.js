const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
  },
  wardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ward",
  },
  status: {
    type: String,
    enum: ["pending", "arrived"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["emergency", "urgent", "routine"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  arrivedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Admission", admissionSchema);