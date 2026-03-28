const Bed = require("../models/Bed");
const { sendEvent } = require("../sse/eventStream");
const { processAdmissionsQueue } = require("../services/admissionService");

// VALID TRANSITIONS
const validTransitions = {
  available: ["occupied", "reserved"],
  occupied: ["cleaning"],
  cleaning: ["available"],
  reserved: ["occupied", "available"],
};

exports.updateBedStatus = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { status } = req.body;

    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    // Validate transition
    if (!validTransitions[bed.status].includes(status)) {
      return res.status(400).json({
        message: `Invalid transition from ${bed.status} to ${status}`,
      });
    }

    // Update logic
    bed.status = status;
    bed.lastUpdated = new Date();

    // 🔥 Cleaning state
    if (status === "cleaning") {
      bed.cleaningStartTime = new Date();
    }

    // 🔥 Available state (bed freed)
    if (status === "available") {
      bed.occupantPatientId = null;
      bed.cleaningStartTime = null;
    }

    await bed.save(); // ✅ SAVE FIRST

    // 🔥 AFTER SAVE → process queue
    if (status === "available") {
      await processAdmissionsQueue(bed.wardId);
    }

    // 🔥 SSE EVENT
    sendEvent("bed-updated", {
      bedId: bed._id,
      wardId: bed.wardId,
      status: bed.status,
    });

    res.json({ success: true, bed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
