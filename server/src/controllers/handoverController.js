const Bed = require("../models/Bed");
const Admission = require("../models/Admission");
const Discharge = require("../models/Discharge");
const Escalation = require("../models/Escalation");
const User = require("../models/User");

// Priority order for sorting
const priorityOrder = {
  emergency: 1,
  urgent: 2,
  routine: 3,
};

exports.generateHandover = async (req, res) => {
  try {
    const { wardId } = req.params;

    // 🛏️ 1. Bed Summary
    const beds = await Bed.find({ wardId }).populate({
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

    // 📥 2. Pending Admissions (sorted by priority)
    let admissions = await Admission.find({
      wardId,
      status: "pending",
    }).populate({
      path: "patientId",
      select: "patientName primaryCondition",
    });

    admissions = admissions.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

    // 📤 3. Pending Discharges
    const discharges = await Discharge.find({
      wardId,
      status: "pending",
    }).populate({
      path: "patientId",
      select: "patientName",
    });

    // 🚨 4. Active Escalations
    const escalations = await Escalation.find({
      wardId,
      resolved: false,
    });

    const criticalEscalations = escalations.filter((e) => e.severity === "RED");

    const warningEscalations = escalations.filter((e) => e.severity !== "RED");

    // 👩‍⚕️ 5. Staff Assignments
    const nurses = await User.find({
      role: "nurse",
      ward: wardId,
    }).populate({
      path: "assignedBeds",
      select: "bedNumber status",
    });

    const doctors = await User.find({
      role: "doctor",
      ward: wardId,
    });

    // 📊 6. Quick Stats
    const stats = {
      totalBeds: bedSummary.total,
      occupiedBeds: bedSummary.occupied,
      pendingAdmissions: admissions.length,
      pendingDischarges: discharges.length,
      activeEscalations: escalations.length,
      criticalEscalations: criticalEscalations.length,
    };

    // 📦 Final Response
    res.json({
      success: true,
      generatedAt: new Date(),

      stats,

      bedSummary,

      admissions,
      discharges,

      escalations: {
        critical: criticalEscalations,
        warnings: warningEscalations,
      },

      staff: {
        doctors,
        nurses,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
