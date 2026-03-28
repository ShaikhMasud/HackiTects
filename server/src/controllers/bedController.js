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

exports.getAllBeds = async (req, res) => {
  try {
    const beds = await Bed.find();
    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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

exports.transferPatient = async (req, res) => {
  try {
    const { sourceBedId, targetBedId } = req.body;

    const sourceBed = await Bed.findById(sourceBedId);
    const targetBed = await Bed.findById(targetBedId);

    if (!sourceBed || !targetBed) {
      return res.status(404).json({ message: "One or both beds not found" });
    }

    if (sourceBed.status !== "occupied" || !sourceBed.occupantPatientId) {
       return res.status(400).json({ message: "Source bed is not occupied" });
    }

    if (!["available", "reserved"].includes(targetBed.status)) {
       return res.status(400).json({ message: "Target bed is not available" });
    }

    // Move patient
    const patientId = sourceBed.occupantPatientId;
    
    // Update Target Bed
    targetBed.status = "occupied";
    targetBed.occupantPatientId = patientId;
    targetBed.lastUpdated = new Date();
    await targetBed.save();

    // Update Source Bed
    sourceBed.status = "cleaning";
    sourceBed.occupantPatientId = null;
    sourceBed.cleaningStartTime = new Date();
    sourceBed.lastUpdated = new Date();
    await sourceBed.save();

    // Fire SSE
    sendEvent("bed-updated", {
      bedId: targetBed._id,
      wardId: targetBed.wardId,
      status: targetBed.status,
    });
    
    sendEvent("bed-updated", {
      bedId: sourceBed._id,
      wardId: sourceBed.wardId,
      status: sourceBed.status,
    });

    res.json({ success: true, message: "Patient transferred successfully" });
  } catch(error) {
    res.status(500).json({ message: error.message });
  }
};
