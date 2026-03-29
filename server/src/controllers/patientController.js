const Patient = require("../models/Patients");

exports.getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const patients = await Patient.find({
      responsibleDoctorId: doctorId,
    });

    const populatedPatients = await Promise.all(
      patients.map(async (p) => {
        const bed = await require("../models/Bed").findOne({ occupantPatientId: p._id }).populate("wardId");
        return {
          ...p.toObject(),
          bed: bed ? bed.bedNumber : "Queue",
          wardId: bed ? bed.wardId : null,
        };
      })
    );

    res.json(populatedPatients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePatientStatus = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.body;

    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { status },
      { new: true }
    );

    if (status === "cleared_for_discharge") {
      const Bed = require("../models/Bed");
      const Discharge = require("../models/Discharge");
      const { sendEvent } = require("../sse/eventStream");

      const bed = await Bed.findOne({ occupantPatientId: patientId });
      
      if (bed) {
        const existingDischarge = await Discharge.findOne({ patientId, status: "pending" });
        
        if (!existingDischarge) {
          await Discharge.create({
            patientId,
            wardId: bed.wardId,
            bedId: bed._id,
            scheduledDischargeTime: new Date()
          });

          sendEvent("discharge-scheduled", {
            wardId: bed.wardId,
            patientId
          });
        }
      }
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePatientCondition = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { condition } = req.body;
    
    const updated = await Patient.findByIdAndUpdate(
      patientId,
      { primaryCondition: condition },
      { new: true }
    );
    res.json({ success: true, patient: updated });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const Bed = require("../models/Bed");
    const Discharge = require("../models/Discharge");
    const Admission = require("../models/Admission");
    const { sendEvent } = require("../sse/eventStream");

    // Clear bed occupancy
    await Bed.findOneAndUpdate({ occupantPatientId: patientId }, { status: 'cleaning', occupantPatientId: null, cleaningStartTime: new Date() });
    
    // Clean up queues
    await Discharge.deleteMany({ patientId });
    await Admission.deleteMany({ patientId });

    // Delete Patient record
    await Patient.findByIdAndDelete(patientId);

    sendEvent("patient-discharged", { patientId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message, success: false });
  }
};

exports.reassignDoctor = async (req, res) => {
  const { patientId } = req.params;
  const { doctorId } = req.body;

  const patient = await Patient.findByIdAndUpdate(
    patientId,
    { responsibleDoctorId: doctorId },
    { new: true },
  );

  sendEvent(`ward-${wardId}`, {
    type: "doctor-assigned",
    data: {
      patientId,
      doctorId,
    },
  });

  res.json(patient);
};

exports.addVitals = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { bp, hr, temp } = req.body;
    const doctorId = req.user.id;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    // Ensure array exists if document is old
    if (!patient.vitalsHistory) {
      patient.vitalsHistory = [];
    }
    
    // Transparently preserve the original admission vitals sequence into the history payload so it doesn't get squashed!
    if (patient.vitalsHistory.length === 0 && patient.vitals && patient.vitals.bp) {
       patient.vitalsHistory.push({
          bp: patient.vitals.bp,
          hr: patient.vitals.hr,
          temp: patient.vitals.temp,
          recordedAt: patient.admissionDate || patient.createdAt || new Date(),
          recordedBy: patient.responsibleDoctorId
       });
    }

    const newVitals = {
      bp,
      hr,
      temp,
      recordedBy: doctorId,
      recordedAt: new Date()
    };

    patient.vitalsHistory.push(newVitals);
    
    // Update the 'current' top-level vitals too
    patient.vitals = { bp, hr, temp };

    await patient.save();

    const { sendEvent } = require("../sse/eventStream");
    sendEvent("patient-admitted", { patientId }); // Trigger universal stream reload to fetch new vitals immediately

    res.json({ success: true, patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addMedication = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medication } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (!patient.medications) {
       patient.medications = [];
    }

    if (medication && medication.trim()) {
       patient.medications.push(medication.trim());
       await patient.save();

       const { sendEvent } = require("../sse/eventStream");
       sendEvent("patient-admitted", { patientId });
    }

    res.json({ success: true, medications: patient.medications });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};

exports.transferAllPatients = async (req, res) => {
  try {
    const currentDoctorId = req.user.id;
    const { nextDoctorId } = req.body;
    
    if (!nextDoctorId) {
       return res.status(400).json({ success: false, message: "Incoming doctor ID is required." });
    }

    const Patient = require("../models/Patients");
    const { sendEvent } = require("../sse/eventStream");

    const result = await Patient.updateMany(
      { responsibleDoctorId: currentDoctorId },
      { $set: { responsibleDoctorId: nextDoctorId } }
    );

    sendEvent("doctor-assigned", { action: "bulk_transfer", from: currentDoctorId, to: nextDoctorId });

    res.json({ success: true, message: `Successfully transferred ${result.modifiedCount} patients.`, count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
