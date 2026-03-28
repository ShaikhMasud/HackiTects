const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    primaryCondition: String,
    conditionAtDischarge: String,
    responsibleDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["admitted", "discharged"],
      default: "admitted",
    },
    admissionDate: Date,
    dischargeDate: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Patient", patientSchema);
