const express = require("express");
const router = express.Router();

const { getDoctorPatients } = require("../controllers/patientController");

router.get("/my-patients", verifyToken, getDoctorPatients);

module.exports = router;
