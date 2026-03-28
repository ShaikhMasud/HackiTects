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
          bed: bed ? bed.bedNumber : "TBD",
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
