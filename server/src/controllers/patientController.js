const Patient = require("../models/Patient");

exports.getDoctorPatients = async (req, res) => {
  const doctorId = req.user.id;

  const patients = await Patient.find({
    responsibleDoctorId: doctorId,
    status: "admitted",
  });

  res.json(patients);
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
