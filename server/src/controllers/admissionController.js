const Admission = require("../models/Admission");
const Patient = require("../models/Patients");
const Bed = require("../models/Bed");
const {
  findAvailableBed,
  processAdmissionsQueue,
  getAdmissionsQueue,
} = require("../services/admissionService");
const { sendEvent } = require("../sse/eventStream");

exports.getAdmissionsQueue = async (req, res) => {
  try {
    const { wardId } = req.params;

    const queue = await getAdmissionsQueue(wardId);

    res.json({
      success: true,
      count: queue.length,
      queue,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create admission
exports.createAdmission = async (req, res) => {
  const { patientName, wardId, priority, doctorId } = req.body;

  const totalBeds = await Bed.countDocuments({ wardId });
  const occupiedBeds = await Bed.countDocuments({
    wardId,
    status: "occupied",
  });

  // Example rule: block if > 120% demand
  if (occupiedBeds >= totalBeds * 1.2) {
    return res.status(400).json({
      message: "Ward overloaded, cannot accept more patients",
    });
  }

  const patient = await Patient.create({
    patientName,
    admissionDate: new Date(),
    responsibleDoctorId: doctorId, 
  });

  sendEvent(`ward-${wardId}`, {
    type: "doctor-assigned",
    data: {
      patientId,
      doctorId,
    },
  });

  const admission = await Admission.create({
    patientId: patient._id,
    wardId,
    priority,
  });

  // Try allocation immediately
  await processAdmissionsQueue(wardId);

  res.json({
    success: true,
    admission,
    message: "Added to queue (or admitted if bed available)",
  });
};

// Get admissions for ward
exports.getWardAdmissions = async (req, res) => {
  const admissions = await Admission.find({
    wardId: req.params.wardId,
  }).populate("patientId");

  res.json(admissions);
};

// Mark arrival (🔥 main logic)
exports.markAdmissionArrived = async (req, res) => {
  const { admissionId } = req.params;

  const admission = await Admission.findById(admissionId);
  if (!admission)
    return res.status(404).json({ message: "Admission not found" });

  if (admission.status === "arrived") {
    return res.status(400).json({ message: "Already arrived" });
  }

  // Find bed
  const bed = await findAvailableBed(admission.wardId);

  if (!bed) {
    return res.status(400).json({
      message: "No available beds",
    });
  }

  // Assign bed
  bed.status = "occupied";
  bed.occupantPatientId = admission.patientId;
  await bed.save();

  // Update admission
  admission.status = "arrived";
  admission.arrivedAt = new Date();
  await admission.save();

  // 🔥 SSE EVENTS
  sendEvent("patient-admitted", {
    admissionId,
    wardId: admission.wardId,
  });

  sendEvent("bed-updated", {
    bedId: bed._id,
    status: "occupied",
  });

  res.json({ success: true, admission, bed });
};
