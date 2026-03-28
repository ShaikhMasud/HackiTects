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
