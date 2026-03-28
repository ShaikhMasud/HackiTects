const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    age: Number,
    gender: { type: String, enum: ["M", "F", "Other"] },
    vitals: {
      bp: String,
      hr: Number,
      temp: Number,
    },
    vitalsHistory: [
      {
        bp: String,
        hr: Number,
        temp: Number,
        recordedAt: { type: Date, default: Date.now },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      }
    ],
    medications: [{ type: String }],
    primaryCondition: String,
    conditionAtDischarge: String,
    responsibleDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["admitted", "critical", "pending_clearance", "cleared_for_discharge", "discharged"],
      default: "admitted",
    },
    admissionDate: Date,
    dischargeDate: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
