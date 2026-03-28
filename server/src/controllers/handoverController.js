const Bed = require("../models/Bed");
const Admission = require("../models/Admission");
const Discharge = require("../models/Discharge");
const Escalation = require("../models/Escalation");
const User = require("../models/User");
const HandoverSnapshot = require("../models/HandoverSnapshot");
const { v4: uuidv4 } = require("uuid"); // For generating unique sharing links

const priorityOrder = {
  emergency: 1,
  urgent: 2,
  routine: 3,
};

// 🤖 Internal Generator Function to scrape DB aggregations globally or per-ward!
const compileHandoverPayload = async (wardId) => {
  const filter = wardId === "all" ? {} : { wardId };

  // 🛏️ 1. Bed Summary
  const beds = await Bed.find(filter)
    .populate({ path: "wardId", select: "wardName" })
    .populate({
      path: "occupantPatientId",
      select: "patientName primaryCondition responsibleDoctorId admissionDate",
    });

  const bedSummary = {
    total: beds.length,
    occupied: beds.filter((b) => b.status === "occupied").length,
    available: beds.filter((b) => b.status === "available").length,
    cleaning: beds.filter((b) => b.status === "cleaning").length,
    reserved: beds.filter((b) => b.status === "reserved").length,
  };

  // 📥 2. Pending Admissions
  let admissions = await Admission.find({
    ...filter,
    status: "pending",
  }).populate({
    path: "patientId",
    select: "patientName primaryCondition",
  }).lean();
  admissions = admissions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 📤 3. Pending Discharges
  const discharges = await Discharge.find({
    ...filter,
    status: "pending",
  }).populate({
    path: "patientId",
    select: "patientName",
  }).lean();

  // 🚨 4. Active Escalations
  const escalations = await Escalation.find({
    ...filter,
    resolved: false,
  })
    .populate({ path: "wardId", select: "wardName" })
    .populate({ path: "relatedBedId", select: "bedNumber" })
    .lean();

  // 👩‍⚕️ 5. Staff Assignments
  const nurses = await User.find({ role: "nurse", ...filter }).populate({
    path: "assignedBeds",
    select: "bedNumber status",
  }).lean();
  const doctors = await User.find({ role: "doctor", ...filter }).lean();

  // 📊 6. Stats
  return {
    success: true,
    generatedAt: new Date(),
    stats: {
      totalBeds: bedSummary.total,
      occupiedBeds: bedSummary.occupied,
      pendingAdmissions: admissions.length,
      pendingDischarges: discharges.length,
      activeEscalations: escalations.length,
      criticalEscalations: escalations.filter((e) => e.severity === "RED").length,
    },
    bedSummary,
    activePatients: beds.filter(b => b.status === "occupied" && b.occupantPatientId).map(b => ({
       bedNumber: b.bedNumber,
       patientName: b.occupantPatientId.patientName,
       condition: b.occupantPatientId.primaryCondition || "Undiagnosed",
       admissionDate: b.occupantPatientId.admissionDate,
       wardName: b.wardId ? b.wardId.wardName : "Unknown Ward"
    })),
    admissions,
    discharges,
    escalations: {
      critical: escalations.filter((e) => e.severity === "RED"),
      warnings: escalations.filter((e) => e.severity !== "RED"),
    },
    staff: { doctors, nurses },
  };
};

/**
 * 📍 Used by UI to manually capture a Shift Handover! Snapshot is stored natively in DB for continuity.
 */
exports.generateHandover = async (req, res) => {
  try {
    const payload = await compileHandoverPayload(req.params.wardId);
    
    // Save Snapshot
    const shiftSnapshot = await HandoverSnapshot.create({
       shiftName: "Manual Capture",
       shareId: uuidv4(),
       reportData: payload
    });

    res.json({
       ...payload,
       shareId: shiftSnapshot.shareId 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * ⏰ Internal Function invoked by Node-Cron scheduled runner
 */
exports.generateAndStoreHandover = async (shiftName) => {
  try {
     const payload = await compileHandoverPayload("all"); // Crons run globally
     await HandoverSnapshot.create({
        shiftName,
        shareId: uuidv4(),
        reportData: payload
     });
     console.log(`[Shift Continuity Engine] Clean compiled & saved globally: ${shiftName}`);
  } catch(e) {
     console.error("[Shift Continuity Engine] Cron Execution Failed: ", e);
  }
};

/**
 * 🔄 Fetch historical shifts list (lightweight, doesn't pull the entire heavy report tree until clicked)
 */
exports.getHandoverHistory = async (req, res) => {
   try {
      const history = await HandoverSnapshot.find({}, 'shiftName generatedAt shareId').sort({ generatedAt: -1 }).limit(30);
      res.json({ success: true, history });
   } catch(e) {
      res.status(500).json({ success: false, message: e.message });
   }
};

/**
 * 🔗 Access shared read-only snapshot securely using unique UUID Token (Allows continuity!)
 */
exports.getSharedHandover = async (req, res) => {
   try {
      const snap = await HandoverSnapshot.findOne({ shareId: req.params.shareId });
      if(!snap) return res.status(404).json({ success: false, message: "Handover expired or does not exist." });

      res.json({
         ...snap.reportData,
         shareId: snap.shareId,
         archivedShiftName: snap.shiftName
      });
   } catch(e) {
      res.status(500).json({ success: false });
   }
};
