const express = require("express");
const router = express.Router();

const { getDoctorPatients, updatePatientStatus } = require("../controllers/patientController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/my-patients", verifyToken, getDoctorPatients);
router.put("/:patientId/status", verifyToken, updatePatientStatus);
router.put("/:patientId/condition", verifyToken, require("../controllers/patientController").updatePatientCondition);

module.exports = router;
