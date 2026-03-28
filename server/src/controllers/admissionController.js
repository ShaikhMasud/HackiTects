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
  try {
    const { patientName, wardId, priority, doctorId, bedId, age, gender, bp, hr, temp, condition } = req.body;

    const totalBeds = await Bed.countDocuments({ wardId });
    const occupiedBeds = await Bed.countDocuments({
      wardId,
      status: "occupied",
    });

    if (occupiedBeds >= totalBeds * 1.2) {
      return res.status(400).json({
        message: "Ward overloaded, cannot accept more patients",
      });
    }

    // Resolve doctorId strictly - if frontend sends "D-101", replace with a valid doctor ID
    let validDoctorId = doctorId;
    if (!require("mongoose").Types.ObjectId.isValid(doctorId)) {
      const doctor = await require("../models/User").findOne({ role: "doctor" });
      if (doctor) {
         validDoctorId = doctor._id;
      } else {
         return res.status(400).json({ message: "No valid doctors found in the database. Please add a doctor first." });
      }
    }

    // Create the patient document
    const patient = await Patient.create({
      patientName,
      age: age || null,
      gender: gender || null,
      vitals: {
         bp: bp || "120/80",
         hr: hr || 70,
         temp: temp || 98.6
      },
      primaryCondition: condition || "Undiagnosed",
      admissionDate: new Date(),
      responsibleDoctorId: validDoctorId, 
    });

    sendEvent(`ward-${wardId}`, {
      type: "doctor-assigned",
      data: {
        patientId: patient._id,
        doctorId: validDoctorId,
      },
    });

    // Check optional bedId logic
    let targetBed = null;
    if (bedId) {
      const isValidObjectId = require("mongoose").Types.ObjectId.isValid(bedId);
      const isNumeric = !isNaN(Number(bedId));

      const orQueries = [];
      if (isValidObjectId) {
         orQueries.push({ _id: bedId });
      }
      if (isNumeric) {
         orQueries.push({ bedNumber: Number(bedId) });
      } else if (!isValidObjectId) {
         // fallback if bedNumber is string based in some schemas
         orQueries.push({ bedNumber: bedId });
      }

      if (orQueries.length > 0) {
        targetBed = await Bed.findOne({
           wardId,
           status: { $in: ["available", "reserved"] },
           $or: orQueries
        });
      }
    }

    const admission = await Admission.create({
      patientId: patient._id,
      wardId,
      priority,
      doctorId: validDoctorId,
      bedId: targetBed ? targetBed._id : null,
      status: targetBed ? "arrived" : "pending"
    });

    if (targetBed) {
      targetBed.status = "occupied";
      targetBed.occupantPatientId = patient._id;
      await targetBed.save();
      
      sendEvent("patient-admitted", {
         admissionId: admission._id,
         wardId: admission.wardId,
      });

      sendEvent("bed-updated", {
         bedId: targetBed._id,
         status: "occupied",
      });
    } else {
      await processAdmissionsQueue(wardId);
    }

    res.json({
      success: true,
      admission,
      message: targetBed ? "Bed directly assigned" : "Added to queue (or admitted if bed available)",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
