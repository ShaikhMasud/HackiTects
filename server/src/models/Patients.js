const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
  },
  admissionDate: Date,
  primaryCondition: String,
  conditionCategory: String,
  responsibleDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["admitted", "discharged"],
    default: "admitted",
  },
  dischargeDate: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Patient", patientSchema);