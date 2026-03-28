const Discharge = require("../models/Discharge");
const Bed = require("../models/Bed");
const Patient = require("../models/Patients");
const { sendEvent } = require("../sse/eventStream");
const { processAdmissionsQueue } = require("../services/admissionService");

// Schedule discharge
exports.scheduleDischarge = async (req, res) => {
  try {
    const { patientId, wardId, bedId, scheduledTime } = req.body;

    const discharge = await Discharge.create({
      patientId,
      wardId,
      bedId,
      scheduledDischargeTime: scheduledTime,
    });

    res.json({ success: true, discharge });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get ward discharges
exports.getWardDischarges = async (req, res) => {
  const discharges = await Discharge.find({
    wardId: req.params.wardId,
    status: "pending",
  }).populate("patientId");

  res.json(discharges);
};

// Complete discharge
exports.completeDischarge = async (req, res) => {
  try {
    const { dischargeId } = req.params;

    const discharge = await Discharge.findById(dischargeId);
    if (!discharge)
      return res.status(404).json({ message: "Discharge not found" });

    if (discharge.status === "completed") {
      return res.status(400).json({ message: "Already completed" });
    }

    // Update discharge
    discharge.status = "completed";
    const now = new Date();

    // Store actual completion timestamp
    discharge.actualDischargeTime = now;

    // Calculate duration from creation
    const createdAt = new Date(discharge.createdAt);

    const diffMs = now - createdAt;
    const durationInMinutes = Math.floor(diffMs / (1000 * 60));

    discharge.durationInMinutes = durationInMinutes;
    await discharge.save();

    // Update patient
    await Patient.findByIdAndUpdate(discharge.patientId, {
      status: "discharged",
      dischargeDate: new Date(),
    });

    // Move bed → cleaning
    const bed = await Bed.findById(discharge.bedId);

    bed.status = "cleaning";
    bed.cleaningStartTime = new Date();
    await bed.save();

    // 🔥 SSE EVENTS
    sendEvent("patient-discharged", {
      patientId: discharge.patientId,
      wardId: discharge.wardId,
    });

    sendEvent("bed-updated", {
      bedId: bed._id,
      status: "cleaning",
    });

    res.json({ success: true, discharge, bed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
