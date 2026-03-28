const User = require("../models/User");
const Bed = require("../models/Bed");
const { sendEvent } = require("../sse/eventStream");

/**
 * 🧑‍⚕️ Assign Nurse to Beds
 */
exports.assignNurseToBeds = async (req, res) => {
  try {
    const { nurseId } = req.params;
    const { bedIds, wardId } = req.body;

    // Validate input
    if (!bedIds || !Array.isArray(bedIds) || bedIds.length === 0) {
      return res
        .status(400)
        .json({ message: "bedIds must be a non-empty array" });
    }

    const nurse = await User.findById(nurseId);

    if (!nurse || nurse.role !== "nurse") {
      return res.status(400).json({ message: "Invalid nurse" });
    }

    // ✅ Validate beds belong to ward
    const beds = await Bed.find({
      _id: { $in: bedIds },
      wardId,
    });

    if (beds.length !== bedIds.length) {
      return res.status(400).json({
        message: "Some beds are invalid or not in this ward",
      });
    }

    // ✅ Prevent duplicate assignment (excluding current nurse)
    const conflictingNurses = await User.find({
      _id: { $ne: nurseId },
      role: "nurse",
      ward: wardId,
      assignedBeds: { $in: bedIds },
    });

    if (conflictingNurses.length > 0) {
      return res.status(400).json({
        message: "Some beds are already assigned to another nurse",
      });
    }

    // ✅ Assign beds
    nurse.assignedBeds = bedIds;
    nurse.ward = wardId;

    await nurse.save();

    // 🔥 SSE EVENT
    sendEvent("nurse-assigned", {
      nurseId,
      wardId,
      bedIds,
    });

    res.json({
      success: true,
      nurse,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 🔁 Get Ward Staff (Doctors + Nurses with beds)
 */
exports.getWardStaff = async (req, res) => {
  try {
    const { wardId } = req.params;

    const doctors = await User.find({
      role: "doctor",
      ward: wardId,
    });

    const nurses = await User.find({
      role: "nurse",
      ward: wardId,
    }).populate("assignedBeds"); // 🔥 important for UI

    res.json({
      success: true,
      doctors,
      nurses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * 🔁 Reassign Doctor to Patient
 */
exports.reassignDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctorId } = req.body;

    const patient = await require("../models/Patient").findByIdAndUpdate(
      patientId,
      { responsibleDoctorId: doctorId },
      { new: true },
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // 🔥 SSE EVENT
    sendEvent("doctor-assigned", {
      patientId,
      doctorId,
    });

    res.json({
      success: true,
      patient,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
