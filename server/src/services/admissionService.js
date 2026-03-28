const Bed = require("../models/Bed");
const Admission = require("../models/Admission");
const { sendEvent } = require("../sse/eventStream");

exports.getAdmissionsQueue = async (wardId) => {
  const admissions = await Admission.find({
    wardId,
    status: "pending",
  })
    .populate("patientId")
    .sort({ createdAt: 1 });

  // Apply priority sort
  return admissions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
};

exports.processAdmissionsQueue = async (wardId) => {
  while (true) {
    const admission = await exports.getNextPriorityAdmission(wardId);
    if (!admission) break;

    const bed = await exports.findAvailableBed(wardId);
    if (!bed) break;

    // Assign bed
    bed.status = "occupied";
    bed.occupantPatientId = admission.patientId;
    await bed.save();

    admission.status = "arrived";
    admission.arrivedAt = new Date();
    await admission.save();

    // 🔥 SSE events
    sendEvent("patient-admitted", {
      admissionId: admission._id,
      wardId,
    });

    sendEvent("bed-updated", {
      bedId: bed._id,
      status: "occupied",
    });
  }
};

// Priority ranking
const priorityOrder = {
  emergency: 1,
  urgent: 2,
  routine: 3,
};

// Get next admission based on priority
exports.getNextPriorityAdmission = async (wardId) => {
  const admissions = await Admission.find({
    wardId,
    status: "pending",
  });

  if (!admissions.length) return null;

  // Sort by priority
  admissions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return admissions[0];
};

// Find available bed
exports.findAvailableBed = async (wardId) => {
  return await Bed.findOne({
    wardId,
    status: "available",
  });
};
