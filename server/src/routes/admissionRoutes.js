const express = require("express");
const router = express.Router();

const {
  createAdmission,
  getWardAdmissions,
  markAdmissionArrived,
  getAdmissionsQueue,
} = require("../controllers/admissionController");

router.post("/", createAdmission);
router.get("/ward/:wardId", getWardAdmissions);
router.put("/:admissionId/arrived", markAdmissionArrived);
router.get("/queue/:wardId", getAdmissionsQueue);

module.exports = router;
